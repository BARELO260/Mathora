package com.calcpro.app.math

import com.calcpro.app.math.Expr.*

/**
 * Diferenciación simbólica sobre el AST, aplicando reglas estándar de cálculo:
 * suma, resta, producto, cociente, regla de la cadena, potencia general y funciones
 * trigonométricas/exponenciales/logarítmicas.
 */
object Differentiator {

    fun derivative(expr: Expr): Expr = simplify(diff(expr))

    private fun diff(e: Expr): Expr = when (e) {
        is Const -> Expr.ZERO
        is Var -> Expr.ONE
        is Add -> Add(diff(e.l), diff(e.r))
        is Sub -> Sub(diff(e.l), diff(e.r))
        is Neg -> Neg(diff(e.e))
        is Mul -> Add(Mul(diff(e.l), e.r), Mul(e.l, diff(e.r))) // regla del producto
        is Div -> Div(
            Sub(Mul(diff(e.l), e.r), Mul(e.l, diff(e.r))),
            Pow(e.r, Const(2.0))
        ) // regla del cociente
        is Pow -> diffPow(e)
        is Fact -> throw MathEvalException("No se puede derivar el factorial simbólicamente")
        is Func -> diffFunc(e)
    }

    private fun diffPow(e: Pow): Expr {
        val (u, v) = e.base to e.exp
        return if (v is Const) {
            // regla de la potencia: d(u^n) = n * u^(n-1) * du
            Mul(Mul(v, Pow(u, Const(v.value - 1.0))), diff(u))
        } else {
            // regla general: d(u^v) = u^v * (dv*ln(u) + v*du/u)
            Mul(
                Pow(u, v),
                Add(
                    Mul(diff(v), Func("ln", u)),
                    Mul(v, Div(diff(u), u))
                )
            )
        }
    }

    private fun diffFunc(e: Func): Expr {
        val u = e.arg
        val du = diff(u)
        val outer: Expr = when (e.name) {
            "sin" -> Func("cos", u)
            "cos" -> Neg(Func("sin", u))
            "tan" -> Div(Const(1.0), Pow(Func("cos", u), Const(2.0)))
            "asin" -> Div(Const(1.0), Func("sqrt", Sub(Const(1.0), Pow(u, Const(2.0)))))
            "acos" -> Neg(Div(Const(1.0), Func("sqrt", Sub(Const(1.0), Pow(u, Const(2.0))))))
            "atan" -> Div(Const(1.0), Add(Const(1.0), Pow(u, Const(2.0))))
            "sinh" -> Func("cosh", u)
            "cosh" -> Func("sinh", u)
            "tanh" -> Sub(Const(1.0), Pow(Func("tanh", u), Const(2.0)))
            "ln" -> Div(Const(1.0), u)
            "log" -> Div(Const(1.0), Mul(u, Const(kotlin.math.ln(10.0))))
            "sqrt" -> Div(Const(1.0), Mul(Const(2.0), Func("sqrt", u)))
            "exp" -> Func("exp", u)
            "abs" -> Div(u, Func("abs", u))
            else -> throw MathEvalException("No sé derivar ${e.name}")
        }
        return Mul(outer, du)
    }

    /** Simplifica constantes triviales (x*1, x+0, 0*x, etc.) para que el resultado sea legible. */
    fun simplify(e: Expr): Expr {
        val s = when (e) {
            is Add -> {
                val l = simplify(e.l); val r = simplify(e.r)
                when {
                    isZero(l) -> r
                    isZero(r) -> l
                    l is Const && r is Const -> Const(l.value + r.value)
                    else -> Add(l, r)
                }
            }
            is Sub -> {
                val l = simplify(e.l); val r = simplify(e.r)
                when {
                    isZero(r) -> l
                    l is Const && r is Const -> Const(l.value - r.value)
                    else -> Sub(l, r)
                }
            }
            is Mul -> {
                val l = simplify(e.l); val r = simplify(e.r)
                when {
                    isZero(l) || isZero(r) -> Expr.ZERO
                    isOne(l) -> r
                    isOne(r) -> l
                    l is Const && r is Const -> Const(l.value * r.value)
                    else -> Mul(l, r)
                }
            }
            is Div -> {
                val l = simplify(e.l); val r = simplify(e.r)
                when {
                    isZero(l) -> Expr.ZERO
                    isOne(r) -> l
                    l is Const && r is Const && r.value != 0.0 -> Const(l.value / r.value)
                    else -> Div(l, r)
                }
            }
            is Pow -> {
                val b = simplify(e.base); val p = simplify(e.exp)
                when {
                    isZero(p) -> Expr.ONE
                    isOne(p) -> b
                    b is Const && p is Const -> Const(Math.pow(b.value, p.value))
                    else -> Pow(b, p)
                }
            }
            is Neg -> {
                val inner = simplify(e.e)
                if (inner is Const) Const(-inner.value) else Neg(inner)
            }
            is Func -> Func(e.name, simplify(e.arg))
            is Fact -> Fact(simplify(e.e))
            else -> e
        }
        return s
    }

    private fun isZero(e: Expr) = e is Const && e.value == 0.0
    private fun isOne(e: Expr) = e is Const && e.value == 1.0
}
