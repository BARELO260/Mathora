package com.calcpro.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Functions
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.calcpro.app.ui.screens.BasicCalculatorScreen
import com.calcpro.app.ui.screens.CalculusScreen
import com.calcpro.app.ui.screens.GraphScreen
import com.calcpro.app.ui.screens.ScientificCalculatorScreen
import com.calcpro.app.viewmodel.CalculatorViewModel

private enum class Tab(val label: String) {
    BASIC("Básica"), SCIENTIFIC("Científica"), CALCULUS("Cálculo"), GRAPH("Gráfica")
}

@Composable
fun MainScreen() {
    var selectedTab by remember { mutableStateOf(Tab.BASIC) }
    val calculatorViewModel: CalculatorViewModel = viewModel()

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == Tab.BASIC,
                    onClick = { selectedTab = Tab.BASIC },
                    icon = { Icon(Icons.Filled.Calculate, contentDescription = null) },
                    label = { Text(Tab.BASIC.label) }
                )
                NavigationBarItem(
                    selected = selectedTab == Tab.SCIENTIFIC,
                    onClick = { selectedTab = Tab.SCIENTIFIC },
                    icon = { Icon(Icons.Filled.Science, contentDescription = null) },
                    label = { Text(Tab.SCIENTIFIC.label) }
                )
                NavigationBarItem(
                    selected = selectedTab == Tab.CALCULUS,
                    onClick = { selectedTab = Tab.CALCULUS },
                    icon = { Icon(Icons.Filled.Functions, contentDescription = null) },
                    label = { Text(Tab.CALCULUS.label) }
                )
                NavigationBarItem(
                    selected = selectedTab == Tab.GRAPH,
                    onClick = { selectedTab = Tab.GRAPH },
                    icon = { Icon(Icons.Filled.ShowChart, contentDescription = null) },
                    label = { Text(Tab.GRAPH.label) }
                )
            }
        }
    ) { padding ->
        androidx.compose.foundation.layout.Box(modifier = Modifier.padding(padding)) {
            when (selectedTab) {
                Tab.BASIC -> BasicCalculatorScreen(calculatorViewModel)
                Tab.SCIENTIFIC -> ScientificCalculatorScreen(calculatorViewModel)
                Tab.CALCULUS -> CalculusScreen()
                Tab.GRAPH -> GraphScreen()
            }
        }
    }
}
