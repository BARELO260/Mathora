package com.calcpro.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.calcpro.app.ui.components.ButtonStyle
import com.calcpro.app.ui.components.CalculatorButton
import com.calcpro.app.viewmodel.CalculatorViewModel

private data class Key(val label: String, val style: ButtonStyle, val action: String? = null)

private val basicKeys = listOf(
    Key("C", ButtonStyle.ACCENT, "CLEAR"), Key("⌫", ButtonStyle.ACCENT, "BACK"), Key("%", ButtonStyle.FUNCTION, "%"), Key("÷", ButtonStyle.OPERATOR, "/"),
    Key("7", ButtonStyle.NUMBER), Key("8", ButtonStyle.NUMBER), Key("9", ButtonStyle.NUMBER), Key("×", ButtonStyle.OPERATOR, "*"),
    Key("4", ButtonStyle.NUMBER), Key("5", ButtonStyle.NUMBER), Key("6", ButtonStyle.NUMBER), Key("−", ButtonStyle.OPERATOR, "-"),
    Key("1", ButtonStyle.NUMBER), Key("2", ButtonStyle.NUMBER), Key("3", ButtonStyle.NUMBER), Key("+", ButtonStyle.OPERATOR, "+"),
    Key("00", ButtonStyle.NUMBER), Key("0", ButtonStyle.NUMBER), Key(".", ButtonStyle.NUMBER), Key("=", ButtonStyle.EQUALS, "EVAL")
)

@Composable
fun BasicCalculatorScreen(viewModel: CalculatorViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        DisplayArea(
            expression = viewModel.expression,
            result = viewModel.resultText,
            onResultTap = { viewModel.useResultAsExpression() }
        )

        Spacer(modifier = Modifier.height(12.dp))

        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(basicKeys) { key ->
                CalculatorButton(
                    label = key.label,
                    style = key.style,
                    fontSize = 24,
                    onClick = { handleKey(viewModel, key) }
                )
            }
        }
    }
}

private fun handleKey(vm: CalculatorViewModel, key: Key) {
    when (key.action) {
        "CLEAR" -> vm.clear()
        "BACK" -> vm.backspace()
        "EVAL" -> vm.evaluate()
        null -> vm.append(key.label)
        else -> vm.append(key.action)
    }
}

@Composable
fun DisplayArea(expression: String, result: String, onResultTap: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        horizontalAlignment = androidx.compose.ui.Alignment.End
    ) {
        Text(
            text = expression.ifEmpty { "0" },
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.End,
            maxLines = 2,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = result,
            style = MaterialTheme.typography.displayLarge,
            fontSize = 48.sp,
            color = MaterialTheme.colorScheme.primary,
            textAlign = TextAlign.End,
            maxLines = 1,
            modifier = Modifier
                .fillMaxWidth()
                .clickable(enabled = result.isNotEmpty()) { onResultTap() }
        )
    }
}
