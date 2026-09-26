package com.calcpro.app.math

/**
 * Árbol de sintaxis abstracta (AST) para expresiones matemáticas de una variable "x".
 */
sealed class Expr {
    data class Const(val value: Double) : Expr()
    object Var : Expr()
    data class Add(val l: Expr, val r: Expr) : Expr()
    data class Sub(val l: Expr, val r: Expr) : Expr()
    data class Mul(val l: Expr, val r: Expr) : Expr()
    data class Div(val l: Expr, val r: Expr) : Expr()
    data class Pow(val base: Expr, val exp: Expr) : Expr()
    data class Neg(val e: Expr) : Expr()
    data class Fact(val e: Expr) : Expr()
    data class Func(val name: String, val arg: Expr) : Expr()

    companion object {
        val ZERO = Const(0.0)
        val ONE = Const(1.0)
    }
}
