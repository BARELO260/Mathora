package com.calcpro.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.calcpro.app.ui.components.ButtonStyle
import com.calcpro.app.ui.components.CalculatorButton
import com.calcpro.app.viewmodel.CalculatorViewModel
import androidx.compose.material3.Text

private data class SciKey(val label: String, val style: ButtonStyle, val insert: String)

// Funciones científicas: se insertan como texto que el parser ya entiende.
private val scientificKeys = listOf(
    SciKey("sin", ButtonStyle.FUNCTION, "sin("), SciKey("cos", ButtonStyle.FUNCTION, "cos("), SciKey("tan", ButtonStyle.FUNCTION, "tan("), SciKey("π", ButtonStyle.FUNCTION, "pi"),
    SciKey("ln", ButtonStyle.FUNCTION, "ln("), SciKey("log", ButtonStyle.FUNCTION, "log("), SciKey("√", ButtonStyle.FUNCTION, "sqrt("), SciKey("e", ButtonStyle.FUNCTION, "e"),
    SciKey("x²", ButtonStyle.FUNCTION, "^2"), SciKey("xʸ", ButtonStyle.FUNCTION, "^"), SciKey("x!", ButtonStyle.FUNCTION, "!"), SciKey("1/x", ButtonStyle.FUNCTION, "^(-1)"),
    SciKey("(", ButtonStyle.OPERATOR, "("), SciKey(")", ButtonStyle.OPERATOR, ")"), SciKey("abs", ButtonStyle.FUNCTION, "abs("), SciKey("exp", ButtonStyle.FUNCTION, "exp(")
)

private data class Key(val label: String, val style: ButtonStyle, val action: String? = null)

private val numPad = listOf(
    Key("C", ButtonStyle.ACCENT, "CLEAR"), Key("⌫", ButtonStyle.ACCENT, "BACK"), Key("%", ButtonStyle.OPERATOR, "%"), Key("÷", ButtonStyle.OPERATOR, "/"),
    Key("7", ButtonStyle.NUMBER), Key("8", ButtonStyle.NUMBER), Key("9", ButtonStyle.NUMBER), Key("×", ButtonStyle.OPERATOR, "*"),
    Key("4", ButtonStyle.NUMBER), Key("5", ButtonStyle.NUMBER), Key("6", ButtonStyle.NUMBER), Key("−", ButtonStyle.OPERATOR, "-"),
    Key("1", ButtonStyle.NUMBER), Key("2", ButtonStyle.NUMBER), Key("3", ButtonStyle.NUMBER), Key("+", ButtonStyle.OPERATOR, "+"),
    Key(".", ButtonStyle.NUMBER), Key("0", ButtonStyle.NUMBER), Key("x", ButtonStyle.FUNCTION, "x"), Key("=", ButtonStyle.EQUALS, "EVAL")
)

@Composable
fun ScientificCalculatorScreen(viewModel: CalculatorViewModel) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        DisplayArea(
            expression = viewModel.expression,
            result = viewModel.resultText,
            onResultTap = { viewModel.useResultAsExpression() }
        )

        Text(
            text = "Funciones científicas",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.fillMaxWidth().height(190.dp)
        ) {
            items(scientificKeys) { key ->
                CalculatorButton(
                    label = key.label,
                    style = key.style,
                    fontSize = 16,
                    onClick = { viewModel.append(key.insert) }
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.fillMaxWidth().weight(1f)
        ) {
            items(numPad) { key ->
                CalculatorButton(
                    label = key.label,
                    style = key.style,
                    fontSize = 20,
                    onClick = {
                        when (key.action) {
                            "CLEAR" -> viewModel.clear()
                            "BACK" -> viewModel.backspace()
                            "EVAL" -> viewModel.evaluate()
                            null -> viewModel.append(key.label)
                            else -> viewModel.append(key.action)
                        }
                    }
                )
            }
        }
    }
}
