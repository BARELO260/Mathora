package com.calcpro.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Functions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.calcpro.app.math.Differentiator
import com.calcpro.app.math.Evaluator
import com.calcpro.app.math.ExpressionParser
import com.calcpro.app.math.Integrator

private enum class CalcMode { DERIVATIVE, INTEGRAL }

@Composable
fun CalculusScreen() {
    var mode by remember { mutableStateOf(CalcMode.DERIVATIVE) }
    var functionInput by remember { mutableStateOf("x^3 + sin(x)") }
    var lowerBound by remember { mutableStateOf("0") }
    var upperBound by remember { mutableStateOf("pi") }
    var evalPoint by remember { mutableStateOf("") }
    var resultSteps by remember { mutableStateOf<List<String>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            "Cálculo simbólico",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(Modifier.height(12.dp))

        SingleChoiceSegmented(mode) { mode = it }

        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = functionInput,
            onValueChange = { functionInput = it },
            label = { Text("f(x) =") },
            leadingIcon = { Icon(Icons.Filled.Functions, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(Modifier.height(12.dp))

        if (mode == CalcMode.INTEGRAL) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = lowerBound,
                    onValueChange = { lowerBound = it },
                    label = { Text("Límite inferior a") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = upperBound,
                    onValueChange = { upperBound = it },
                    label = { Text("Límite superior b") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }
            Text(
                "Deja los límites en blanco para obtener solo la integral indefinida (antiderivada).",
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 12.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 6.dp)
            )
        } else {
            OutlinedTextField(
                value = evalPoint,
                onValueChange = { evalPoint = it },
                label = { Text("Evaluar derivada en x = (opcional)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        }

        Spacer(Modifier.height(16.dp))

        Button(
            onClick = {
                error = null
                resultSteps = try {
                    if (mode == CalcMode.DERIVATIVE) {
                        computeDerivative(functionInput, evalPoint)
                    } else {
                        computeIntegral(functionInput, lowerBound, upperBound)
                    }
                } catch (e: Exception) {
                    error = e.message ?: "No se pudo resolver la expresión"
                    emptyList()
                }
            },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(if (mode == CalcMode.DERIVATIVE) "Derivar" else "Integrar", fontSize = 16.sp)
        }

        Spacer(Modifier.height(20.dp))

        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }

        resultSteps.forEach { line ->
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
            ) {
                Text(
                    line,
                    modifier = Modifier.padding(14.dp),
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }
    }
}

@Composable
private fun SingleChoiceSegmented(current: CalcMode, onSelect: (CalcMode) -> Unit) {
    val options = listOf(CalcMode.DERIVATIVE to "Derivada", CalcMode.INTEGRAL to "Integral")
    Row(Modifier.fillMaxWidth()) {
        options.forEachIndexed { index, (mode, label) ->
            SegmentedButton(
                selected = current == mode,
                onClick = { onSelect(mode) },
                shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size)
            ) {
                Text(label)
            }
        }
    }
}

private fun computeDerivative(input: String, evalPointText: String): List<String> {
    val ast = ExpressionParser.parse(input)
    val derivative = Differentiator.derivative(ast)
    val lines = mutableListOf<String>()
    lines.add("f(x) = $input")
    lines.add("f'(x) = ${Evaluator.toText(derivative)}")
    if (evalPointText.isNotBlank()) {
        val point = ExpressionParser.parse(evalPointText)
        val value = Evaluator.eval(point)
        val result = Evaluator.eval(derivative, value)
        lines.add("f'(${Evaluator.formatNumber(value)}) = ${Evaluator.formatNumber(result)}")
    }
    return lines
}

private fun computeIntegral(input: String, lowerText: String, upperText: String): List<String> {
    val ast = ExpressionParser.parse(input)
    val lines = mutableListOf<String>()
    lines.add("f(x) = $input")

    val symbolic = Integrator.symbolicIntegral(ast)
    if (symbolic != null) {
        lines.add("∫f(x)dx = ${Evaluator.toText(symbolic)} + C")
    } else {
        lines.add("∫f(x)dx: sin forma elemental simple; se calculará numéricamente para límites dados")
    }

    if (lowerText.isNotBlank() && upperText.isNotBlank()) {
        val a = Evaluator.eval(ExpressionParser.parse(lowerText))
        val b = Evaluator.eval(ExpressionParser.parse(upperText))
        val numeric = Integrator.numericIntegral(ast, a, b)
        lines.add("∫ from ${Evaluator.formatNumber(a)} to ${Evaluator.formatNumber(b)} = ${Evaluator.formatNumber(numeric)}")
    }
    return lines
}

