package com.calcpro.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class ButtonStyle { NUMBER, OPERATOR, FUNCTION, EQUALS, ACCENT }

@Composable
fun CalculatorButton(
    label: String,
    modifier: Modifier = Modifier,
    style: ButtonStyle = ButtonStyle.NUMBER,
    fontSize: Int = 20,
    onClick: () -> Unit
) {
    val containerColor = when (style) {
        ButtonStyle.NUMBER -> MaterialTheme.colorScheme.surfaceVariant
        ButtonStyle.OPERATOR -> MaterialTheme.colorScheme.primaryContainer
        ButtonStyle.FUNCTION -> MaterialTheme.colorScheme.secondaryContainer
        ButtonStyle.EQUALS -> MaterialTheme.colorScheme.primary
        ButtonStyle.ACCENT -> MaterialTheme.colorScheme.tertiaryContainer
    }
    val contentColor = when (style) {
        ButtonStyle.EQUALS -> MaterialTheme.colorScheme.onPrimary
        ButtonStyle.OPERATOR -> MaterialTheme.colorScheme.onPrimaryContainer
        ButtonStyle.FUNCTION -> MaterialTheme.colorScheme.onSecondaryContainer
        ButtonStyle.ACCENT -> MaterialTheme.colorScheme.onTertiaryContainer
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Surface(
        modifier = modifier
            .aspectRatio(1.3f)
            .padding(4.dp),
        shape = RoundedCornerShape(20.dp),
        color = containerColor,
        onClick = onClick,
        tonalElevation = 1.dp
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            Text(
                text = label,
                color = contentColor,
                fontSize = fontSize.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
