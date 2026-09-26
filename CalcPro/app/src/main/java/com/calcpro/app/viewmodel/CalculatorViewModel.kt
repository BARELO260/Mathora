package com.calcpro.app.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.calcpro.app.math.Evaluator
import com.calcpro.app.math.ExpressionParser

data class HistoryEntry(val expression: String, val result: String)

class CalculatorViewModel : ViewModel() {

    // --- Calculadora básica / científica (comparten el mismo display) ---
    var expression by mutableStateOf("")
        private set
    var resultText by mutableStateOf("")
        private set
    var history = mutableStateOf(listOf<HistoryEntry>())
        private set

    fun append(token: String) {
        if (resultText.isNotEmpty() && expression.isEmpty()) {
            // continuar operando sobre el resultado anterior
        }
        expression += token
    }

    fun clear() {
        expression = ""
        resultText = ""
    }

    fun backspace() {
        if (expression.isNotEmpty()) expression = expression.dropLast(1)
    }

    fun evaluate() {
        if (expression.isBlank()) return
        try {
            val ast = ExpressionParser.parse(expression)
            val value = Evaluator.eval(ast)
            val formatted = Evaluator.formatNumber(value)
            resultText = formatted
            history.value = listOf(HistoryEntry(expression, formatted)) + history.value.take(19)
        } catch (e: Exception) {
            resultText = "Error"
        }
    }

    fun useResultAsExpression() {
        if (resultText.isNotEmpty() && resultText != "Error") {
            expression = resultText
            resultText = ""
        }
    }
}
