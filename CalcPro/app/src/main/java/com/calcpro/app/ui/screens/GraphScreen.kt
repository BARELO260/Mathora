package com.calcpro.app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Functions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.calcpro.app.math.Evaluator
import com.calcpro.app.math.Expr
import com.calcpro.app.math.ExpressionParser
import kotlin.math.floor
import kotlin.math.log10
import kotlin.math.pow

@Composable
fun GraphScreen() {
    var functionInput by remember { mutableStateOf("sin(x)") }
    var parsedExpr by remember { mutableStateOf<Expr?>(null) }
    var parseError by remember { mutableStateOf<String?>(null) }

    // Ventana de la gráfica en coordenadas matemáticas (se actualiza con pan/zoom)
    var centerX by remember { mutableStateOf(0.0) }
    var centerY by remember { mutableStateOf(0.0) }
    var scale by remember { mutableStateOf(60.0) } // píxeles por unidad

    fun tryParse() {
        parsedExpr = try {
            val e = ExpressionParser.parse(functionInput)
            parseError = null
            e
        } catch (ex: Exception) {
            parseError = "No se pudo interpretar f(x)"
            null
        }
    }

    LaunchedEffect(Unit) { tryParse() }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Graficador", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(12.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = functionInput,
                onValueChange = { functionInput = it },
                label = { Text("f(x) =") },
                leadingIcon = { Icon(Icons.Filled.Functions, contentDescription = null) },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            Spacer(Modifier.width(8.dp))
            Button(onClick = { tryParse() }, shape = RoundedCornerShape(14.dp)) {
                Text("Graficar")
            }
        }

        parseError?.let {
            Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
        }

        Spacer(Modifier.height(12.dp))

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectTransformGestures { _, pan, zoom, _ ->
                            scale = (scale * zoom).coerceIn(5.0, 4000.0)
                            centerX -= pan.x / scale
                            centerY += pan.y / scale
                        }
                    }
            ) {
                drawGraph(
                    expr = parsedExpr,
                    width = size.width,
                    height = size.height,
                    centerX = centerX,
                    centerY = centerY,
                    scale = scale
                )
            }
        }

        Spacer(Modifier.height(8.dp))
        Text(
            "Arrastra para mover, pellizca para hacer zoom.",
            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 12.sp),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawGraph(
    expr: Expr?,
    width: Float,
    height: Float,
    centerX: Double,
    centerY: Double,
    scale: Double
) {
    val w = width.toDouble()
    val h = height.toDouble()

    val originPx = Offset(
        x = (w / 2 - centerX * scale).toFloat(),
        y = (h / 2 + centerY * scale).toFloat()
    )

    val gridColor = Color(0x33888888)
    val axisColor = Color(0xFF888888)

    // Espaciado de cuadrícula "agradable" (1, 2, 5 * potencia de 10) según el zoom
    val rawStep = 80.0 / scale
    val magnitude = 10.0.pow(floor(log10(rawStep)))
    val niceStep = when {
        rawStep / magnitude < 2 -> magnitude
        rawStep / magnitude < 5 -> 2 * magnitude
        else -> 5 * magnitude
    }

    // líneas verticales
    var gx = floor((centerX - w / 2 / scale) / niceStep) * niceStep
    val maxX = centerX + w / 2 / scale
    while (gx <= maxX) {
        val px = (w / 2 + (gx - centerX) * scale).toFloat()
        drawLine(gridColor, Offset(px, 0f), Offset(px, height), strokeWidth = 1f)
        gx += niceStep
    }
    // líneas horizontales
    var gy = floor((centerY - h / 2 / scale) / niceStep) * niceStep
    val maxY = centerY + h / 2 / scale
    while (gy <= maxY) {
        val py = (h / 2 - (gy - centerY) * scale).toFloat()
        drawLine(gridColor, Offset(0f, py), Offset(width, py), strokeWidth = 1f)
        gy += niceStep
    }

    // ejes
    drawLine(axisColor, Offset(0f, originPx.y), Offset(width, originPx.y), strokeWidth = 3f, cap = StrokeCap.Round)
    drawLine(axisColor, Offset(originPx.x, 0f), Offset(originPx.x, height), strokeWidth = 3f, cap = StrokeCap.Round)

    if (expr == null) return

    // curva de la función: muestreo denso en píxeles, con salto si hay discontinuidad
    val curveColor = Color(0xFF9B6BFF)
    var previous: Offset? = null
    var px = 0
    val widthInt = width.toInt()
    while (px < widthInt) {
        val mathX = centerX + (px - w / 2) / scale
        val y = try { Evaluator.eval(expr, mathX) } catch (e: Exception) { Double.NaN }
        if (y.isNaN() || y.isInfinite()) {
            previous = null
            px += 2
            continue
        }
        val py = (h / 2 - (y - centerY) * scale).toFloat()
        val current = Offset(px.toFloat(), py)
        val prev = previous
        if (prev != null && kotlin.math.abs(current.y - prev.y) < height * 3) {
            drawLine(curveColor, prev, current, strokeWidth = 5f, cap = StrokeCap.Round)
        }
        previous = current
        px += 2
    }
}
