package com.calcpro.app.math

import com.calcpro.app.math.Expr.*

object Integrator {

    /**
     * Intenta encontrar una antiderivada simbólica para casos comunes (potencias, suma,
     * múltiplo constante, sin, cos, exp, 1/x, funciones lineales compuestas simples).
     * Devuelve null si el patrón no está soportado; en ese caso se debe usar integración numérica.
     */
    fun symbolicIntegral(expr: Expr): Expr? {
        val e = Differentiator.simplify(expr)
        return try {
            Differentiator.simplify(integrate(e))
        } catch (ex: Exception) {
            null
        }
    }

    private fun integrate(e: Expr): Expr = when (e) {
        is Const -> Mul(e, Var)
        is Var -> Div(Pow(Var, Const(2.0)), Const(2.0))
        is Add -> Add(integrate(e.l), integrate(e.r))
        is Sub -> Sub(integrate(e.l), integrate(e.r))
        is Neg -> Neg(integrate(e.e))
        is Mul -> integrateMul(e)
        is Pow -> integratePow(e)
        is Func -> integrateFunc(e)
        is Div -> integrateDiv(e)
        is Fact -> throw MathEvalException("No soportado")
    }

    private fun isConstExpr(e: Expr): Boolean = when (e) {
        is Const -> true
        is Neg -> isConstExpr(e.e)
        is Add -> isConstExpr(e.l) && isConstExpr(e.r)
        is Mul -> isConstExpr(e.l) && isConstExpr(e.r)
        else -> false
    }

    private fun integrateMul(e: Mul): Expr {
        // múltiplo constante: ∫ c*f(x) dx = c * ∫f(x)dx
        if (isConstExpr(e.l)) return Mul(e.l, integrate(e.r))
        if (isConstExpr(e.r)) return Mul(e.r, integrate(e.l))
        throw MathEvalException("Producto de funciones no soportado (usa integración numérica)")
    }

    private fun integratePow(e: Pow): Expr {
        if (e.base is Var && e.exp is Const) {
            val n = e.exp.value
            if (n == -1.0) return Func("ln", Func("abs", Var))
            return Div(Pow(Var, Const(n + 1.0)), Const(n + 1.0))
        }
        throw MathEvalException("Potencia no soportada")
    }

    private fun integrateDiv(e: Div): Expr {
        // 1/x -> ln|x|
        if (e.l is Const && e.l.value == 1.0 && e.r is Var) {
            return Func("ln", Func("abs", Var))
        }
        // c / x
        if (isConstExpr(e.l) && e.r is Var) {
            return Mul(e.l, Func("ln", Func("abs", Var)))
        }
        throw MathEvalException("Cociente no soportado")
    }

    private fun integrateFunc(e: Func): Expr {
        if (e.arg !is Var) throw MathEvalException("Composición no soportada simbólicamente")
        return when (e.name) {
            "sin" -> Neg(Func("cos", Var))
            "cos" -> Func("sin", Var)
            "exp" -> Func("exp", Var)
            "sinh" -> Func("cosh", Var)
            "cosh" -> Func("sinh", Var)
            else -> throw MathEvalException("Función no soportada")
        }
    }

    /**
     * Integración numérica definida por la regla de Simpson compuesta.
     * Funciona para (casi) cualquier función continua, incluso si no tiene antiderivada elemental.
     */
    fun numericIntegral(expr: Expr, a: Double, b: Double, steps: Int = 2000): Double {
        var n = steps
        if (n % 2 != 0) n++
        val h = (b - a) / n
        var sum = Evaluator.eval(expr, a) + Evaluator.eval(expr, b)
        for (i in 1 until n) {
            val x = a + i * h
            val y = Evaluator.eval(expr, x)
            sum += if (i % 2 == 0) 2 * y else 4 * y
        }
        return sum * h / 3.0
    }
}
