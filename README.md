# BO∞ Tracker - Bayesian Sequential Hypothesis Testing

A statistically principled tracker for best-of-infinite matches using Bayesian sequential testing with Region of Practical Equivalence (ROPE).

## Features

- **Beta-Binomial Model**: Conjugate prior for efficient O(1) updates
- **ROPE Margin**: Distinguish between "better" and "practically equal" (prevents declaring winners on 50.1% vs 49.9%)
- **Real-time Visualization**: Live Beta distribution PDF with shaded regions
- **Sequential Testing**: Auto-stop when posterior probability exceeds your threshold
- **Zero Backend**: Pure client-side JavaScript using jStat

## The Math

### Model
- **Prior**: θ ~ Beta(α₀, β₀) where θ is Player A's win probability
- **Posterior**: θ|data ~ Beta(α₀ + winsA, β₀ + winsB)
- **Stopping Rule**: Stop when max(P(θ > 0.5 + δ), P(θ < 0.5 - δ)) ≥ X%

Where:
- δ = ROPE margin (default 5%)
- X = target certainty (default 95%)

### Why Bayesian?
Unlike frequentist SPRT, this gives you **"probability that Player A is better"** rather than p-values, which is what users intuitively want.

## Usage

1. **Setup**: Configure players, certainty threshold (e.g., 95%), and ROPE margin
2. **Play**: Click win buttons or use keyboard shortcuts (A/Left Arrow for Player A, B/Right Arrow for Player B)
3. **Auto-stop**: When certainty threshold is reached or max games limit hit

## Keyboard Shortcuts
- `A` or `←` - Record win for Player A
- `B` or `→` - Record win for Player B
- `R` - Reset match

## Configuration Options

- **Target Certainty**: Confidence threshold to declare winner (50-99.9%)
- **ROPE Margin**: Practical equivalence region (0-20%, default 5%)
  - 0% = treat any difference as meaningful
  - 5% = only declare winner if >55% vs <45% winrate
- **Max Games**: Auto-stop limit if inconclusive
- **Prior**:
  - Uniform Beta(1,1) - no initial bias
  - Jeffreys Beta(0.5,0.5) - slight bias toward extremes

## Deployment

Deploy to GitHub Pages:
```bash
# Initialize repo
git init
git add .
git commit -m "Initial commit: Bayesian BO∞ tracker"

# Create GitHub repo and push
gh repo create bo-infinite-tracker --public --source=. --push

# Enable GitHub Pages
gh repo edit --enable-pages --pages-branch main
```

Your app will be live at: `https://yourusername.github.io/bo-infinite-tracker/`

## Technical Details

- **Libraries**: jStat (Beta distribution), Chart.js (visualization)
- **No build step**: Vanilla JS, runs entirely in browser
- **Stateless**: All calculations from scratch each update (fast enough for practical use)

## Future Enhancements

- **Time decay**: Exponential weighting for non-stationary skills (γ decay)
- **Multi-player**: Bradley-Terry model for tournaments
- **Match history**: LocalStorage persistence
- **Export**: CSV/JSON download of match data

## References

- [ROPE methodology](https://nyu-cdsc.github.io)
- [Beta-Binomial conjugacy](https://en.wikipedia.org/wiki/Conjugate_prior#Discrete_distributions)
- [Sequential testing](https://en.wikipedia.org/wiki/Sequential_probability_ratio_test)

## License

MIT
