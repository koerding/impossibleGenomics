import React, { useState, useMemo } from 'react';

export default function CausalHorizonCalculator() {
  const [numGenes, setNumGenes] = useState(20000);
  const [numSamples, setNumSamples] = useState(200);
  const [backgroundVariance, setBackgroundVariance] = useState(0.2);
  const [expectedDelta, setExpectedDelta] = useState(0.1);

  // Standard normal CDF approximation
  const normalCDF = (x) => {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  };

  const calculations = useMemo(() => {
    const gamma = numGenes / numSamples;
    const sigmaMin = backgroundVariance * Math.pow(gamma, 0.25);
    
    // Z-score: how many sigma is our expected delta from zero?
    const zScore = expectedDelta / sigmaMin;
    
    // If we set threshold at 2*sigmaMin (standard practice)
    const threshold = 2 * sigmaMin;
    
    // False positive rate: P(noise exceeds threshold) = P(Z > threshold/sigmaMin) = P(Z > 2)
    const falsePositiveRate = 1 - normalCDF(threshold / sigmaMin);
    
    // False negative rate: P(true signal falls below threshold)
    // Signal is centered at delta with spread sigmaMin
    // P(signal < threshold) = P(Z < (threshold - delta)/sigmaMin)
    const falseNegativeRate = normalCDF((threshold - expectedDelta) / sigmaMin);
    
    // Statistical power = 1 - false negative rate
    const power = 1 - falseNegativeRate;
    
    const isHighDimensional = gamma > 1;
    const isDetectable = expectedDelta > threshold;
    
    return {
      gamma,
      sigmaMin,
      threshold,
      zScore,
      falsePositiveRate,
      falseNegativeRate,
      power,
      isHighDimensional,
      isDetectable,
    };
  }, [numGenes, numSamples, backgroundVariance, expectedDelta]);

  const formatNumber = (n, decimals = 3) => {
    if (n < 0.0001) return n.toExponential(2);
    if (n > 10000) return n.toExponential(2);
    return n.toFixed(decimals);
  };

  const formatPercent = (n) => {
    if (n < 0.0001) return '< 0.01%';
    if (n > 0.9999) return '> 99.99%';
    return (n * 100).toFixed(2) + '%';
  };

  const getRegimeColor = (gamma) => {
    if (gamma > 10) return '#ff4444';
    if (gamma > 1) return '#ff8844';
    if (gamma > 0.1) return '#44aa44';
    return '#22cc66';
  };

  const getRegimeLabel = (gamma) => {
    if (gamma > 10) return 'Deep in the Trap';
    if (gamma > 1) return 'High-Dimensional Trap';
    if (gamma > 0.1) return 'Approaching Horizon';
    return 'Below Horizon';
  };

  const getPowerColor = (power) => {
    if (power > 0.8) return '#22cc66';
    if (power > 0.5) return '#44aa44';
    if (power > 0.2) return '#ff8844';
    return '#ff4444';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e8e8e8',
      fontFamily: '"IBM Plex Sans", -apple-system, sans-serif',
      padding: '40px 20px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: #1a1a24;
          border-radius: 3px;
          outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: #e8e8e8;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #e8e8e8;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#666',
            marginBottom: '16px',
            fontWeight: 500,
          }}>
            Spectral Wall Calculator
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 300,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-1px',
          }}>
            The Causal Horizon
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#888',
            marginTop: '20px',
            lineHeight: 1.6,
            maxWidth: '650px',
            fontWeight: 300,
          }}>
            In high-dimensional genomic data, the 1/f background creates a noise floor that no algorithm can penetrate. 
            This calculator shows whether your expected effect size is detectable given your experimental design.
          </p>
        </div>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '40px',
        }}>
          {/* Controls Panel */}
          <div style={{
            background: 'linear-gradient(135deg, #12121a 0%, #0d0d14 100%)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid #1a1a28',
          }}>
            <h2 style={{
              fontSize: '13px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#666',
              marginTop: 0,
              marginBottom: '32px',
              fontWeight: 500,
            }}>
              Parameters
            </h2>

            {/* Number of Genes */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '8px',
              }}>
                <label style={{ fontSize: '14px', color: '#ccc' }}>
                  Number of genes or other predictors (p)
                </label>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '18px',
                  fontWeight: 500,
                }}>
                  {numGenes.toLocaleString()}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
                lineHeight: 1.5,
              }}>
                The number of features (genes, transcripts) in your dataset. Higher dimensionality increases the noise floor.
              </div>
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={numGenes}
                onChange={(e) => setNumGenes(Number(e.target.value))}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#444',
                marginTop: '6px',
              }}>
                <span>100</span>
                <span>50,000</span>
              </div>
            </div>

            {/* Number of Samples */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '8px',
              }}>
                <label style={{ fontSize: '14px', color: '#ccc' }}>
                  Number of Samples (N)
                </label>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '18px',
                  fontWeight: 500,
                }}>
                  {numSamples.toLocaleString()}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
                lineHeight: 1.5,
              }}>
                The number of independent observations (patients, cells). More samples allow better estimation of the background covariance.
              </div>
              <input
                type="range"
                min="10"
                max="100000"
                step="10"
                value={numSamples}
                onChange={(e) => setNumSamples(Number(e.target.value))}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#444',
                marginTop: '6px',
              }}>
                <span>10</span>
                <span>100,000</span>
              </div>
            </div>

            {/* Background Variance */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '8px',
              }}>
                <label style={{ fontSize: '14px', color: '#ccc' }}>
                  Background Variance (σ<sub>fixed</sub>)
                </label>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '18px',
                  fontWeight: 500,
                }}>
                  {backgroundVariance.toFixed(2)}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
                lineHeight: 1.5,
              }}>
                The typical standard deviation of pairwise correlations due to global cell state (metabolism, cell cycle). Usually ~0.2 for transcriptomics.
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={backgroundVariance}
                onChange={(e) => setBackgroundVariance(Number(e.target.value))}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#444',
                marginTop: '6px',
              }}>
                <span>0.05</span>
                <span>0.50</span>
              </div>
            </div>

            {/* Expected Effect Size */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '8px',
              }}>
                <label style={{ fontSize: '14px', color: '#ccc' }}>
                  Expected Effect Size (δ)
                </label>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '18px',
                  fontWeight: 500,
                }}>
                  {expectedDelta.toFixed(3)}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
                lineHeight: 1.5,
              }}>
                The correlation strength you expect between a true regulator and its target. Complex traits typically have δ ~ 0.05–0.15.
              </div>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.005"
                value={expectedDelta}
                onChange={(e) => setExpectedDelta(Number(e.target.value))}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#444',
                marginTop: '6px',
              }}>
                <span>0.01</span>
                <span>0.50</span>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div>
            {/* Statistical Power - Main Result */}
            <div style={{
              background: 'linear-gradient(135deg, #12121a 0%, #0d0d14 100%)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #1a1a28',
              marginBottom: '20px',
            }}>
              <h2 style={{
                fontSize: '13px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#666',
                marginTop: 0,
                marginBottom: '24px',
                fontWeight: 500,
              }}>
                Detection Statistics
              </h2>

              {/* Power */}
              <div style={{
                background: '#0a0a0f',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '16px',
                textAlign: 'center',
                border: `1px solid ${getPowerColor(calculations.power)}33`,
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '8px',
                  letterSpacing: '1px',
                }}>
                  STATISTICAL POWER
                </div>
                <div style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '48px',
                  fontWeight: 500,
                  color: getPowerColor(calculations.power),
                  letterSpacing: '-2px',
                }}>
                  {formatPercent(calculations.power)}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '12px',
                }}>
                  Probability of detecting a true effect of size δ = {expectedDelta.toFixed(3)}
                </div>
              </div>

              {/* Error rates */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <div style={{
                  background: '#0a0a0f',
                  borderRadius: '10px',
                  padding: '18px',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#555',
                    marginBottom: '6px',
                    letterSpacing: '0.5px',
                  }}>
                    False Positive Rate (α)
                  </div>
                  <div style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '22px',
                    fontWeight: 500,
                    color: calculations.falsePositiveRate > 0.05 ? '#ff8844' : '#888',
                  }}>
                    {formatPercent(calculations.falsePositiveRate)}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#444',
                    marginTop: '8px',
                    lineHeight: 1.4,
                  }}>
                    P(calling an edge when none exists)
                  </div>
                </div>

                <div style={{
                  background: '#0a0a0f',
                  borderRadius: '10px',
                  padding: '18px',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#555',
                    marginBottom: '6px',
                    letterSpacing: '0.5px',
                  }}>
                    False Negative Rate (β)
                  </div>
                  <div style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '22px',
                    fontWeight: 500,
                    color: calculations.falseNegativeRate > 0.2 ? '#ff4444' : '#888',
                  }}>
                    {formatPercent(calculations.falseNegativeRate)}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#444',
                    marginTop: '8px',
                    lineHeight: 1.4,
                  }}>
                    P(missing a true edge of size δ)
                  </div>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div style={{
              padding: '20px',
              background: '#0d0d14',
              borderRadius: '12px',
              border: '1px solid #1a1a28',
            }}>
              <div style={{
                fontSize: '12px',
                color: '#888',
                lineHeight: 1.7,
              }}>
                <strong style={{ color: '#aaa' }}>Interpretation:</strong>{' '}
                {calculations.power < 0.2 ? (
                  <>
                    Your expected effect size (δ = {expectedDelta.toFixed(3)}) is below the noise floor 
                    (σ<sub>min</sub> = {formatNumber(calculations.sigmaMin)}). You have only a {formatPercent(calculations.power)} chance 
                    of detecting true regulatory interactions. This is not an algorithm problem—it's a 
                    fundamental information-theoretic limit. Consider increasing N or reducing p.
                  </>
                ) : calculations.power < 0.8 ? (
                  <>
                    Your study is underpowered. With δ = {expectedDelta.toFixed(3)} and noise floor 
                    σ<sub>min</sub> = {formatNumber(calculations.sigmaMin)}, you'll miss {formatPercent(calculations.falseNegativeRate)} of 
                    true interactions. To reach 80% power, you need either larger effects, more samples, 
                    or fewer features.
                  </>
                ) : (
                  <>
                    Your design has adequate power ({formatPercent(calculations.power)}) to detect effects 
                    of size δ = {expectedDelta.toFixed(3)}. The noise floor σ<sub>min</sub> = {formatNumber(calculations.sigmaMin)} is 
                    sufficiently below your expected signal. Causal inference is feasible.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formula Reference */}
        <div style={{
          marginTop: '48px',
          padding: '28px',
          background: '#0d0d14',
          borderRadius: '12px',
          border: '1px solid #1a1a28',
        }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#555',
            marginBottom: '16px',
            fontWeight: 500,
          }}>
            The Spectral Wall Theorem
          </div>
          <div style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '15px',
            color: '#aaa',
            lineHeight: 2,
          }}>
            <div>σ<sub>min</sub> = σ<sub>fixed</sub> · (p/N)<sup>1/4</sup></div>
            <div>Power = 1 − Φ((2σ<sub>min</sub> − δ) / σ<sub>min</sub>)</div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#555',
            marginTop: '16px',
            lineHeight: 1.6,
          }}>
            The noise floor σ<sub>min</sub> emerges from the optimal tradeoff between removing background 
            covariance (which requires estimating principal components) and the estimation error from 
            finite samples. No algorithm can go below this floor. Detection threshold set at 2σ<sub>min</sub>.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid #1a1a28',
          fontSize: '12px',
          color: '#444',
          textAlign: 'center',
        }}>
          Based on "The Causal Horizon: Why Machine Learning Cannot Overcome the 1/f Limits of Genomic Inference"
        </div>
      </div>
    </div>
  );
}
