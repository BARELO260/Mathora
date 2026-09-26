package com.calcpro.app.math

class ExpressionParseException(message: String) : Exception(message)

/**
 * Parser de expresiones matemáticas escritas como texto, ej: "sin(x^2) + 3*ln(x) - 5!"
 *
 * Gramática (precedencia de menor a mayor):
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/' | implícito) unary)*
 *   unary   := '-' unary | power
 *   power   := postfix ('^' unary)?          // asociativo a la derecha
 *   postfix := primary ('!')*
 *   primary := número | 'x' | 'pi' | 'e' | funcion '(' expr (',' expr)? ')' | '(' expr ')'
 *
 * Soporta multiplicación implícita: "2x", "2(x+1)", "2 sin(x)".
 */
class ExpressionParser(input: String) {

    private val text = input
        .replace(" ", "")
        .replace("×", "*")
        .replace("÷", "/")
        .replace("−", "-")
        .lowercase()
    private var pos = 0

    companion object {
        val FUNCTIONS = setOf(
            "sin", "cos", "tan", "asin", "acos", "atan",
            "sinh", "cosh", "tanh",
            "ln", "log", "sqrt", "exp", "abs"
        )

        fun parse(input: String): Expr {
            if (input.isBlank()) throw ExpressionParseException("Expresión vacía")
            val parser = ExpressionParser(input)
            val result = parser.parseExpr()
            if (parser.pos != parser.text.length) {
                throw ExpressionParseException("Carácter inesperado en posición ${parser.pos}")
            }
            return result
        }
    }

    private fun peek(): Char? = if (pos < text.length) text[pos] else null

    private fun parseExpr(): Expr {
        var node = parseTerm()
        while (true) {
            when (peek()) {
                '+' -> { pos++; node = Expr.Add(node, parseTerm()) }
                '-' -> { pos++; node = Expr.Sub(node, parseTerm()) }
                else -> return node
            }
        }
    }

    private fun parseTerm(): Expr {
        var node = parseUnary()
        while (true) {
            val c = peek()
            when {
                c == '*' -> { pos++; node = Expr.Mul(node, parseUnary()) }
                c == '/' -> { pos++; node = Expr.Div(node, parseUnary()) }
                c != null && (c.isDigit() || c == '.' || c == '(' || c.isLetter()) -> {
                    // multiplicación implícita: "2x", "3(x+1)", "2sin(x)"
                    node = Expr.Mul(node, parseUnary())
                }
                else -> return node
            }
        }
    }

    private fun parseUnary(): Expr {
        if (peek() == '-') { pos++; return Expr.Neg(parseUnary()) }
        if (peek() == '+') { pos++; return parseUnary() }
        return parsePower()
    }

    private fun parsePower(): Expr {
        val base = parsePostfix()
        if (peek() == '^') {
            pos++
            val exponent = parseUnary() // asociatividad derecha, permite -exp
            return Expr.Pow(base, exponent)
        }
        return base
    }

    private fun parsePostfix(): Expr {
        var node = parsePrimary()
        while (peek() == '!') {
            pos++
            node = Expr.Fact(node)
        }
        return node
    }

    private fun parsePrimary(): Expr {
        val c = peek() ?: throw ExpressionParseException("Expresión incompleta")

        if (c == '(') {
            pos++
            val e = parseExpr()
            if (peek() != ')') throw ExpressionParseException("Falta ')'")
            pos++
            return e
        }

        if (c.isDigit() || c == '.') {
            val start = pos
            while (peek() != null && (peek()!!.isDigit() || peek() == '.')) pos++
            // notación científica: 1.2e-5, 3e10 (solo si viene seguida de dígitos)
            if (peek() == 'e' || peek() == 'E') {
                val savedPos = pos
                var lookahead = pos + 1
                if (lookahead < text.length && (text[lookahead] == '+' || text[lookahead] == '-')) lookahead++
                if (lookahead < text.length && text[lookahead].isDigit()) {
                    pos = lookahead
                    while (peek() != null && peek()!!.isDigit()) pos++
                } else {
                    pos = savedPos
                }
            }
            return Expr.Const(text.substring(start, pos).toDouble())
        }

        if (c.isLetter()) {
            val start = pos
            while (peek() != null && peek()!!.isLetter()) pos++
            val word = text.substring(start, pos)

            if (word in FUNCTIONS) {
                if (peek() != '(') throw ExpressionParseException("Se esperaba '(' después de $word")
                pos++
                val arg1 = parseExpr()
                var expr = Expr.Func(word, arg1)
                if (word == "log" && peek() == ',') {
                    // log(base, x) -> tratamos log(x) como log10 y log(b,x) como cambio de base
                    pos++
                    val arg2 = parseExpr()
                    expr = Expr.Div(Expr.Func("ln", arg2), Expr.Func("ln", arg1))
                }
                if (peek() != ')') throw ExpressionParseException("Falta ')' en $word")
                pos++
                return expr
            }
            return when (word) {
                "x" -> Expr.Var
                "pi" -> Expr.Const(Math.PI)
                "e" -> Expr.Const(Math.E)
                else -> throw ExpressionParseException("Símbolo desconocido: $word")
            }
        }

        throw ExpressionParseException("Carácter inesperado: '$c'")
    }
}
