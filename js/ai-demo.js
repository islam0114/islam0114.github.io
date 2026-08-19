/* ==========================================================================
   INTERACTIVE IN-BROWSER AI PREDICTOR & INFERENCE PLAYGROUND
   Simulates ML Scoring & SHAP Feature Contribution in Real-Time
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Elements
  const creditScoreSlider = document.getElementById('demo-credit-score');
  const creditScoreVal = document.getElementById('val-credit-score');
  
  const balanceSlider = document.getElementById('demo-balance');
  const balanceVal = document.getElementById('val-balance');
  
  const ageSlider = document.getElementById('demo-age');
  const ageVal = document.getElementById('val-age');
  
  const tenureSlider = document.getElementById('demo-tenure');
  const tenureVal = document.getElementById('val-tenure');
  
  const productsPills = document.querySelectorAll('.pill-option[data-products]');
  const activePills = document.querySelectorAll('.pill-option[data-active]');
  
  const gaugeCircle = document.getElementById('gauge-progress');
  const gaugeScoreText = document.getElementById('gauge-score');
  const gaugeRiskBadge = document.getElementById('gauge-risk-tag');
  
  const barCredit = document.getElementById('bar-credit');
  const barBalance = document.getElementById('bar-balance');
  const barAge = document.getElementById('bar-age');
  const barActive = document.getElementById('bar-active');

  const presetButtons = document.querySelectorAll('[data-preset]');

  // Initial State Values
  let state = {
    creditScore: 650,
    balance: 50000,
    age: 38,
    tenure: 5,
    products: 1,
    isActiveMember: 1
  };

  // Sigmoid Helper
  function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  // Model Inference Simulator (Log-odds based on real churn statistical weights)
  function computeInference() {
    // Standardized feature weights (based on real-world bank churn XGBoost/Logistic models)
    // Baseline log-odds intercept
    let z = -0.5;

    // Credit score impact (higher score -> lowers churn)
    const normCredit = (state.creditScore - 650) / 100;
    const impactCredit = -0.45 * normCredit;

    // Age impact (older demographics in retail banking often have slightly higher churn vulnerability)
    const normAge = (state.age - 35) / 10;
    const impactAge = 0.65 * normAge;

    // Balance impact
    const normBalance = (state.balance - 70000) / 40000;
    const impactBalance = 0.35 * normBalance;

    // Active member impact (active members churn significantly less)
    const impactActive = state.isActiveMember === 1 ? -0.85 : 0.65;

    // Products impact (having 2 products is optimal; 3+ or 1 increases churn risk)
    let impactProducts = 0;
    if (state.products === 1) impactProducts = 0.2;
    else if (state.products === 2) impactProducts = -0.7;
    else impactProducts = 0.95;

    // Tenure impact (loyalty decreases churn)
    const impactTenure = -0.08 * (state.tenure - 5);

    // Sum log-odds
    z += impactCredit + impactAge + impactBalance + impactActive + impactProducts + impactTenure;

    // Convert to probability percentage (0 - 100%)
    const rawProb = sigmoid(z);
    const churnProbability = Math.round(rawProb * 100);

    // Calculate individual visual impact percentages (SHAP approximation)
    const impacts = {
      credit: Math.min(100, Math.max(10, Math.abs(impactCredit) * 45)),
      creditPositive: impactCredit < 0,
      age: Math.min(100, Math.max(10, Math.abs(impactAge) * 35)),
      agePositive: impactAge < 0,
      balance: Math.min(100, Math.max(10, Math.abs(impactBalance) * 40)),
      balancePositive: impactBalance < 0,
      active: Math.min(100, Math.max(15, Math.abs(impactActive) * 50)),
      activePositive: impactActive < 0
    };

    updateUI(churnProbability, impacts);
  }

  function updateUI(probability, impacts) {
    if (!gaugeCircle || !gaugeScoreText) return;

    // 1. Update Gauge Text
    gaugeScoreText.textContent = `${probability}%`;

    // 2. Update Gauge SVG Circle (stroke-dasharray = 440)
    // 0% = 440 offset (empty), 100% = 0 offset (full)
    const maxOffset = 440;
    const offset = maxOffset - (probability / 100) * maxOffset;
    gaugeCircle.style.strokeDashoffset = offset;

    // 3. Update Risk Tier & Colors
    if (probability < 30) {
      gaugeRiskBadge.className = 'gauge-risk-tag risk-low';
      gaugeRiskBadge.textContent = 'Low Churn Risk';
      gaugeCircle.style.stroke = '#10b981'; // Emerald
    } else if (probability < 65) {
      gaugeRiskBadge.className = 'gauge-risk-tag risk-moderate';
      gaugeRiskBadge.textContent = 'Moderate Risk';
      gaugeCircle.style.stroke = '#f59e0b'; // Amber
    } else {
      gaugeRiskBadge.className = 'gauge-risk-tag risk-high';
      gaugeRiskBadge.textContent = 'High Churn Alert';
      gaugeCircle.style.stroke = '#ef4444'; // Red
    }

    // 4. Update Feature Impact Bars
    if (barCredit) {
      barCredit.style.width = `${impacts.credit}%`;
      barCredit.className = `feature-bar-fill ${impacts.creditPositive ? 'bar-positive' : 'bar-negative'}`;
    }
    if (barBalance) {
      barBalance.style.width = `${impacts.balance}%`;
      barBalance.className = `feature-bar-fill ${impacts.balancePositive ? 'bar-positive' : 'bar-negative'}`;
    }
    if (barAge) {
      barAge.style.width = `${impacts.age}%`;
      barAge.className = `feature-bar-fill ${impacts.agePositive ? 'bar-positive' : 'bar-negative'}`;
    }
    if (barActive) {
      barActive.style.width = `${impacts.active}%`;
      barActive.className = `feature-bar-fill ${impacts.activePositive ? 'bar-positive' : 'bar-negative'}`;
    }
  }

  // Bind Slider Events
  if (creditScoreSlider) {
    creditScoreSlider.addEventListener('input', function(e) {
      state.creditScore = parseInt(e.target.value);
      if (creditScoreVal) creditScoreVal.textContent = state.creditScore;
      computeInference();
    });
  }

  if (balanceSlider) {
    balanceSlider.addEventListener('input', function(e) {
      state.balance = parseInt(e.target.value);
      if (balanceVal) balanceVal.textContent = `$${state.balance.toLocaleString()}`;
      computeInference();
    });
  }

  if (ageSlider) {
    ageSlider.addEventListener('input', function(e) {
      state.age = parseInt(e.target.value);
      if (ageVal) ageVal.textContent = `${state.age} yrs`;
      computeInference();
    });
  }

  if (tenureSlider) {
    tenureSlider.addEventListener('input', function(e) {
      state.tenure = parseInt(e.target.value);
      if (tenureVal) tenureVal.textContent = `${state.tenure} yrs`;
      computeInference();
    });
  }

  // Pill Selector Bindings
  productsPills.forEach(pill => {
    pill.addEventListener('click', function() {
      productsPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      state.products = parseInt(this.getAttribute('data-products'));
      computeInference();
    });
  });

  activePills.forEach(pill => {
    pill.addEventListener('click', function() {
      activePills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      state.isActiveMember = parseInt(this.getAttribute('data-active'));
      computeInference();
    });
  });

  // Presets Handlers
  presetButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      presetButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const preset = this.getAttribute('data-preset');
      if (preset === 'loyal') {
        state = { creditScore: 780, balance: 125000, age: 34, tenure: 8, products: 2, isActiveMember: 1 };
      } else if (preset === 'at-risk') {
        state = { creditScore: 540, balance: 25000, age: 52, tenure: 1, products: 3, isActiveMember: 0 };
      } else {
        state = { creditScore: 650, balance: 50000, age: 38, tenure: 5, products: 1, isActiveMember: 1 };
      }

      // Sync form controls
      if (creditScoreSlider) { creditScoreSlider.value = state.creditScore; creditScoreVal.textContent = state.creditScore; }
      if (balanceSlider) { balanceSlider.value = state.balance; balanceVal.textContent = `$${state.balance.toLocaleString()}`; }
      if (ageSlider) { ageSlider.value = state.age; ageVal.textContent = `${state.age} yrs`; }
      if (tenureSlider) { tenureSlider.value = state.tenure; tenureVal.textContent = `${state.tenure} yrs`; }

      productsPills.forEach(p => {
        p.classList.toggle('active', parseInt(p.getAttribute('data-products')) === state.products);
      });
      activePills.forEach(p => {
        p.classList.toggle('active', parseInt(p.getAttribute('data-active')) === state.isActiveMember);
      });

      computeInference();
    });
  });

  // Run initial calculation
  computeInference();
});
