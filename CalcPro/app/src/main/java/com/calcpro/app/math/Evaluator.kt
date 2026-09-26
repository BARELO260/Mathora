package com.calcpro.app.math

import kotlin.math.*

class MathEvalException(message: String) : Exception(message)

object Evaluator {

    fun eval(expr: Expr, x: Double = 0.0): Double = when (expr) {
        is Expr.Const -> expr.value
        is Expr.Var -> x
        is Expr.Add -> eval(expr.l, x) + eval(expr.r, x)
        is Expr.Sub -> eval(expr.l, x) - eval(expr.r, x)
        is Expr.Mul -> eval(expr.l, x) * eval(expr.r, x)
        is Expr.Div -> {
            val denom = eval(expr.r, x)
            if (denom == 0.0) Double.NaN else eval(expr.l, x) / denom
        }
        is Expr.Pow -> {
            val base = eval(expr.base, x)
            val exponent = eval(expr.exp, x)
            if (base < 0.0 && floor(exponent) != exponent) Double.NaN
            else base.pow(exponent)
        }
        is Expr.Neg -> -eval(expr.e, x)
        is Expr.Fact -> factorial(eval(expr.e, x))
        is Expr.Func -> {
            val a = eval(expr.arg, x)
            when (expr.name) {
                "sin" -> sin(a)
                "cos" -> cos(a)
                "tan" -> tan(a)
                "asin" -> asin(a)
                "acos" -> acos(a)
                "atan" -> atan(a)
                "sinh" -> sinh(a)
                "cosh" -> cosh(a)
                "tanh" -> tanh(a)
                "ln" -> ln(a)
                "log" -> log10(a)
                "sqrt" -> sqrt(a)
                "exp" -> exp(a)
                "abs" -> abs(a)
                else -> throw MathEvalException("Función desconocida: ${expr.name}")
            }
        }
    }

    private fun factorial(n: Double): Double {
        if (n < 0.0 || floor(n) != n) {
            // Aproximación con función Gamma (Stirling) para no enteros / valida dominio simple
            return gamma(n + 1.0)
        }
        var result = 1.0
        var i = 2
        while (i <= n.toInt()) { result *= i; i++ }
        return result
    }

    // Aproximación de Lanczos para la función Gamma (soporta factorial de decimales)
    private val g = 7.0
    private val lanczosCoef = doubleArrayOf(
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    )

    private fun gamma(x: Double): Double {
        if (x < 0.5) {
            return PI / (sin(PI * x) * gamma(1 - x))
        }
        val xx = x - 1
        var a = lanczosCoef[0]
        val t = xx + g + 0.5
        for (i in 1..8) a += lanczosCoef[i] / (xx + i)
        return sqrt(2 * PI) * t.pow(xx + 0.5) * exp(-t) * a
    }

    /** Convierte el AST de nuevo a texto legible (para mostrar derivadas/integrales simplificadas). */
    fun toText(expr: Expr): String = when (expr) {
        is Expr.Const -> formatNumber(expr.value)
        is Expr.Var -> "x"
        is Expr.Add -> "(${toText(expr.l)} + ${toText(expr.r)})"
        is Expr.Sub -> "(${toText(expr.l)} - ${toText(expr.r)})"
        is Expr.Mul -> "${toText(expr.l)}*${toText(expr.r)}"
        is Expr.Div -> "${toText(expr.l)}/${toText(expr.r)}"
        is Expr.Pow -> "${toText(expr.base)}^${toText(expr.exp)}"
        is Expr.Neg -> "-${toText(expr.e)}"
        is Expr.Fact -> "${toText(expr.e)}!"
        is Expr.Func -> "${expr.name}(${toText(expr.arg)})"
    }

    fun formatNumber(v: Double): String {
        if (v.isNaN()) return "Error"
        if (v.isInfinite()) return if (v > 0) "∞" else "-∞"
        if (v == v.toLong().toDouble() && abs(v) < 1e15) return v.toLong().toString()
        return try {
            val bd = java.math.BigDecimal(v).round(java.math.MathContext(10))
            var s = bd.toPlainString()
            if (s.contains('.')) s = s.trimEnd('0').trimEnd('.')
            if (s.isEmpty() || s == "-") "0" else s
        } catch (e: Exception) {
            v.toString()
        }
    }
}
