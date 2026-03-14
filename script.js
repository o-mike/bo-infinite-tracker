// Global state
let state = {
    winsA: 0,
    winsB: 0,
    threshold: 0.95,
    rope: 0.05,
    maxGames: 100,
    priorAlpha: 1,
    priorBeta: 1,
    playerAName: 'Player A',
    playerBName: 'Player B',
    chart: null,
    finalChart: null,
    matchEnded: false,
    history: [] // Track probability evolution over time
};

// Toggle advanced options
function toggleAdvanced() {
    const advancedOptions = document.getElementById('advancedOptions');
    const toggleText = document.getElementById('advancedToggleText');

    if (advancedOptions.classList.contains('hidden')) {
        advancedOptions.classList.remove('hidden');
        toggleText.textContent = '▼ Advanced Options';
    } else {
        advancedOptions.classList.add('hidden');
        toggleText.textContent = '▶ Advanced Options';
    }
}

// Start a new match with user settings
function startMatch() {
    state.playerAName = document.getElementById('playerA').value || 'Player A';
    state.playerBName = document.getElementById('playerB').value || 'Player B';
    state.threshold = parseFloat(document.getElementById('threshold').value) / 100;
    state.rope = parseFloat(document.getElementById('rope').value) / 100;
    state.maxGames = parseInt(document.getElementById('maxGames').value);

    const priorType = document.getElementById('prior').value;
    if (priorType === 'jeffreys') {
        state.priorAlpha = 0.5;
        state.priorBeta = 0.5;
    } else {
        state.priorAlpha = 1;
        state.priorBeta = 1;
    }

    state.winsA = 0;
    state.winsB = 0;
    state.matchEnded = false;
    state.history = [{ game: 0, probA: 0.5, probB: 0.5, probDraw: 0 }]; // Initial state

    // Update UI
    document.getElementById('nameA').textContent = state.playerAName;
    document.getElementById('nameB').textContent = state.playerBName;
    document.getElementById('winButtonA').textContent = `${state.playerAName} Wins`;
    document.getElementById('winButtonB').textContent = `${state.playerBName} Wins`;
    document.getElementById('probALabel').textContent = `${state.playerAName} is better:`;
    document.getElementById('probBLabel').textContent = `${state.playerBName} is better:`;
    document.getElementById('targetDisplay').textContent = `${(state.threshold * 100).toFixed(1)}%`;
    document.getElementById('ropeDisplay').textContent = `${(state.rope * 100).toFixed(1)}%`;

    document.getElementById('setupPanel').classList.add('hidden');
    document.getElementById('matchPanel').classList.remove('hidden');

    updateDisplay();
    initChart();
}

// Record a win for a player
function recordWin(player) {
    if (state.matchEnded) return;

    if (player === 'A') {
        state.winsA++;
    } else {
        state.winsB++;
    }

    updateDisplay();
    checkStoppingCondition();
}

// Calculate posterior probabilities
function calculatePosterior() {
    const alpha = state.priorAlpha + state.winsA;
    const beta = state.priorBeta + state.winsB;

    // P(theta > 0.5 + rope) - Player A is practically better
    const probA = 1 - jStat.beta.cdf(0.5 + state.rope, alpha, beta);

    // P(theta < 0.5 - rope) - Player B is practically better
    const probB = jStat.beta.cdf(0.5 - state.rope, alpha, beta);

    // P(they are practically equal)
    const probDraw = 1 - probA - probB;

    return { probA, probB, probDraw, alpha, beta };
}

// Update the display with current probabilities
function updateDisplay() {
    const { probA, probB, probDraw, alpha, beta } = calculatePosterior();
    const totalGames = state.winsA + state.winsB;

    // Add to history
    state.history.push({ game: totalGames, probA, probB, probDraw });

    // Update scores
    document.getElementById('scoreA').textContent = state.winsA;
    document.getElementById('scoreB').textContent = state.winsB;
    document.getElementById('gamesPlayed').textContent = totalGames;

    // Update posterior parameters
    document.getElementById('alpha').textContent = alpha.toFixed(1);
    document.getElementById('beta').textContent = beta.toFixed(1);

    // Update probability bars
    document.getElementById('barA').style.width = `${probA * 100}%`;
    document.getElementById('probAValue').textContent = `${(probA * 100).toFixed(1)}%`;

    document.getElementById('barB').style.width = `${probB * 100}%`;
    document.getElementById('probBValue').textContent = `${(probB * 100).toFixed(1)}%`;

    document.getElementById('barDraw').style.width = `${probDraw * 100}%`;
    document.getElementById('probDrawValue').textContent = `${(probDraw * 100).toFixed(1)}%`;

    // Highlight bars approaching threshold
    updateBarHighlight('barA', probA);
    updateBarHighlight('barB', probB);

    // Update chart
    updateChart();
}

function updateBarHighlight(barId, prob) {
    const bar = document.getElementById(barId);
    bar.classList.remove('bar-warning', 'bar-success');

    if (prob >= state.threshold) {
        bar.classList.add('bar-success');
    } else if (prob >= state.threshold * 0.8) {
        bar.classList.add('bar-warning');
    }
}

// Check if we should stop
function checkStoppingCondition() {
    const { probA, probB } = calculatePosterior();
    const totalGames = state.winsA + state.winsB;

    let stopReason = null;
    let winner = null;

    if (probA >= state.threshold) {
        stopReason = `${state.playerAName} is better with ${(probA * 100).toFixed(1)}% certainty`;
        winner = 'A';
    } else if (probB >= state.threshold) {
        stopReason = `${state.playerBName} is better with ${(probB * 100).toFixed(1)}% certainty`;
        winner = 'B';
    } else if (totalGames >= state.maxGames) {
        stopReason = `Max games (${state.maxGames}) reached. Too close to call.`;
        winner = 'draw';
    }

    if (stopReason) {
        state.matchEnded = true;
        showResultModal(stopReason, winner);
    }
}

// Show result modal
function showResultModal(message, winner) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('resultTitle');

    if (winner === 'A') {
        title.textContent = `${state.playerAName} Wins! 🏆`;
        title.style.color = '#3b82f6';
    } else if (winner === 'B') {
        title.textContent = `${state.playerBName} Wins! 🏆`;
        title.style.color = '#ef4444';
    } else {
        title.textContent = 'Match Inconclusive';
        title.style.color = '#6b7280';
    }

    document.getElementById('resultMessage').innerHTML = `
        <strong>${message}</strong><br><br>
        Final Score: ${state.playerAName} ${state.winsA} - ${state.winsB} ${state.playerBName}<br>
        Games Played: ${state.winsA + state.winsB}
    `;

    modal.classList.remove('hidden');

    // Draw final distribution
    setTimeout(() => drawFinalChart(), 100);
}

function closeModal() {
    document.getElementById('resultModal').classList.add('hidden');
}

// Initialize Chart.js for probability evolution over time
function initChart() {
    const ctx = document.getElementById('betaChart');

    if (state.chart) {
        state.chart.destroy();
    }

    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: `${state.playerAName} is better`,
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 3
                },
                {
                    label: 'Practically Equal',
                    data: [],
                    borderColor: '#9ca3af',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 2,
                    borderDash: [5, 5]
                },
                {
                    label: `${state.playerBName} is better`,
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                title: {
                    display: true,
                    text: 'Probability Evolution Over Time',
                    font: { size: 16 }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + (context.parsed.y * 100).toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Games Played'
                    },
                    min: 0,
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Probability'
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 300
            }
        }
    });

    updateChart();
}

function updateChart() {
    if (!state.chart) return;

    // Convert history to chart data format
    const probAData = state.history.map(h => ({ x: h.game, y: h.probA }));
    const probDrawData = state.history.map(h => ({ x: h.game, y: h.probDraw }));
    const probBData = state.history.map(h => ({ x: h.game, y: h.probB }));

    state.chart.data.datasets[0].data = probAData;
    state.chart.data.datasets[1].data = probDrawData;
    state.chart.data.datasets[2].data = probBData;

    // Add threshold line
    if (state.history.length > 0) {
        const maxGame = state.history[state.history.length - 1].game;
        state.chart.options.plugins.annotation = {
            annotations: {
                thresholdLine: {
                    type: 'line',
                    yMin: state.threshold,
                    yMax: state.threshold,
                    borderColor: 'rgba(0, 0, 0, 0.3)',
                    borderWidth: 2,
                    borderDash: [10, 5],
                    label: {
                        display: true,
                        content: `Target: ${(state.threshold * 100).toFixed(0)}%`,
                        position: 'end'
                    }
                }
            }
        };
    }

    state.chart.update();
}

function drawFinalChart() {
    const ctx = document.getElementById('finalChart');

    if (state.finalChart) {
        state.finalChart.destroy();
    }

    // Convert history to chart data format
    const probAData = state.history.map(h => ({ x: h.game, y: h.probA }));
    const probDrawData = state.history.map(h => ({ x: h.game, y: h.probDraw }));
    const probBData = state.history.map(h => ({ x: h.game, y: h.probB }));

    state.finalChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: `${state.playerAName} is better`,
                    data: probAData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 3
                },
                {
                    label: 'Practically Equal',
                    data: probDrawData,
                    borderColor: '#9ca3af',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 2,
                    borderDash: [5, 5]
                },
                {
                    label: `${state.playerBName} is better`,
                    data: probBData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                title: {
                    display: true,
                    text: 'Final Probability Evolution',
                    font: { size: 14 }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + (context.parsed.y * 100).toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Games Played'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Probability'
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Reset current match
function resetMatch() {
    state.winsA = 0;
    state.winsB = 0;
    state.matchEnded = false;
    state.history = [{ game: 0, probA: 0.5, probB: 0.5, probDraw: 0 }];
    updateDisplay();
}

// Go back to setup
function backToSetup() {
    document.getElementById('matchPanel').classList.add('hidden');
    document.getElementById('setupPanel').classList.remove('hidden');

    if (state.chart) {
        state.chart.destroy();
        state.chart = null;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (document.getElementById('matchPanel').classList.contains('hidden')) return;
    if (state.matchEnded) return;

    // 'A' or Left Arrow for Player A win
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        recordWin('A');
    }
    // 'B' or Right Arrow for Player B win
    else if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowRight') {
        recordWin('B');
    }
    // 'R' to reset
    else if (e.key === 'r' || e.key === 'R') {
        if (confirm('Reset the current match?')) {
            resetMatch();
        }
    }
});
