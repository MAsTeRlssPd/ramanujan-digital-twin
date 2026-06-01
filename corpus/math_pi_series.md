---
topic: Ramanujan's Series for Pi
type: math
key_terms: pi formulas, 1/pi series, modular equations, singular moduli, approximations to pi, Chudnovsky formula, Ramanujan-Sato series, pi computation, rapidly converging series, hypergeometric series
---

# Ramanujan's Formulas for 1/π

## Overview

Ramanujan discovered an extraordinary collection of formulas for 1/π involving rapidly converging infinite series. These formulas are among the most beautiful and practically important results in all of mathematics. They were published in his 1914 paper "Modular equations and approximations to π" in the *Quarterly Journal of Mathematics* (Oxford), vol. 45, pp. 350–372. This paper contained 17 such series, many of which converge so rapidly that each additional term adds approximately 8 decimal digits of precision.

## The Most Famous Formula

Ramanujan's most celebrated formula for 1/π is:

$$\frac{1}{\pi} = \frac{2\sqrt{2}}{9801} \sum_{n=0}^{\infty} \frac{(4n)!(1103 + 26390n)}{(n!)^4 \cdot 396^{4n}}$$

This series converges at a breathtaking rate. The factor 396^4 = 24591257856 in the denominator means that each successive term is roughly 10^(-8) times the previous one — each term of the series contributes approximately **8 correct decimal digits** of π.

The very first term (n = 0) alone gives:

$$\frac{1}{\pi} \approx \frac{2\sqrt{2}}{9801} \times 1103 = \frac{2\sqrt{2} \times 1103}{9801}$$

which yields π ≈ 3.14159265358979..., correct to 6 decimal places.

This formula was used by Bill Gosper in 1985 to compute 17 million digits of π, marking the first time a Ramanujan-type series was used for a record computation.

## The 17 Series in the 1914 Paper

In "Modular equations and approximations to π," Ramanujan presented 17 series for 1/π. These fall into several families based on the level of the modular equation involved. Some notable examples include:

**Series of level 2 (involving √2):**

$$\frac{4}{\pi} = \sum_{n=0}^{\infty} \frac{(6n)!(1 + 7n + \frac{31}{4}n^2 + ...)}{(3n)!(n!)^3 \cdot (-256)^n}$$

(Ramanujan gave several such series with different algebraic coefficients.)

**Series of level 4:**

$$\frac{1}{\pi} = \frac{2\sqrt{2}}{9801} \sum_{n=0}^{\infty} \frac{(4n)!(1103 + 26390n)}{(n!)^4 \cdot 396^{4n}}$$

**Other notable series from the paper include:**

$$\frac{4}{\pi} = \sum_{n=0}^{\infty} \frac{(-1)^n (6n)! (13591409 + 545140134n)}{(3n)!(n!)^3 \cdot 640320^{3n+3/2}}$$

(This particular form is closely related to the Chudnovsky formula discussed below.)

Ramanujan also gave simpler but slower-converging series such as:

$$\frac{4}{\pi} = \sum_{n=0}^{\infty} \frac{(-1)^n (1123 + 21460n)(2n)!^3}{n!^3 (882)^{2n+1} \cdot 4^n}$$

All 17 series were stated without proof. Ramanujan indicated that they followed from modular equations but provided no detailed derivations. The proofs were supplied much later by the Borwein brothers (Jonathan and Peter Borwein) in the 1980s and by Berndt and others in subsequent decades.

## Mathematical Foundation: Modular Equations and Singular Moduli

The theoretical basis for Ramanujan's π formulas lies in the theory of **modular equations** and **singular moduli** (also called class invariants).

### Modular Equations

A modular equation of degree n relates the complete elliptic integrals K and K' at two arguments k and l, where the ratio K'(l)/K(l) = n × K'(k)/K(k). Ramanujan discovered modular equations of many degrees and used them to derive relations between the associated quantities.

### Singular Moduli

A **singular modulus** k_N is the value of the elliptic modular function at the argument τ = √(-N), where N is a positive integer. At these special values, the complete elliptic integrals satisfy algebraic relations that can be computed explicitly.

Ramanujan's π formulas arise from evaluating hypergeometric functions at singular moduli. The general structure is:

$$\frac{1}{\pi} = \sum_{n=0}^{\infty} \frac{(\frac{1}{2})_n (s)_n (1-s)_n}{(n!)^3} (a + bn) x^n$$

where (·)_n denotes the Pochhammer symbol (rising factorial), and a, b, x are algebraic numbers determined by the singular modulus and related quantities. The parameter s takes values 1/2, 1/3, 1/4, or 1/6, corresponding to different families of series.

The mysterious numbers in Ramanujan's formula — 9801, 1103, 26390, 396 — all arise from evaluating these algebraic quantities at specific singular moduli. In particular:
- 396 = 4 × 99, and 99² = 9801
- The number 1103 is related to the class invariant G_58
- The discriminant -4 × 58 = -232 determines the relevant imaginary quadratic field

## The Ramanujan-Sato General Form

The general form underlying all of Ramanujan's π series (and their generalizations) is now called the **Ramanujan-Sato series**:

$$\frac{1}{\pi} = \sum_{n=0}^{\infty} s(n) \frac{A + Bn}{C^n}$$

where s(n) is a sequence satisfying a specific recurrence relation (typically expressible in terms of factorials or Pochhammer symbols), and A, B, C are algebraic constants.

Different choices of the underlying modular data yield different series. The classification of all such series is connected to:
- **Modular curves** of genus zero
- **Calabi-Yau differential equations**
- **Hypergeometric motives**

The Ramanujan-Sato framework has been extended by many mathematicians, including Sato, Guillera, Zudilin, and Cooper, who have found hundreds of additional series of this type.

## The Chudnovsky Formula

In 1988, the Chudnovsky brothers (David and Gregory) discovered a closely related series that converges even faster:

$$\frac{1}{\pi} = 12 \sum_{n=0}^{\infty} \frac{(-1)^n (6n)! (13591409 + 545140134n)}{(3n)!(n!)^3 \cdot 640320^{3n + 3/2}}$$

Each term of the Chudnovsky series contributes approximately **14 decimal digits** of π, making it significantly faster than Ramanujan's original 9801-series. This improvement comes from using a larger discriminant (d = 163, the famous Heegner number, where e^{π√163} ≈ 640320³ + 744).

The Chudnovsky formula has been used for virtually all modern π computation records:
- 1989: Chudnovsky brothers, ~1 billion digits
- 2009: Fabrice Bellard, ~2.7 trillion digits
- 2020: Timothy Mullican, 50 trillion digits
- 2022: Emma Haruka Iwao (Google), 100 trillion digits

All of these records used the Chudnovsky formula or direct variants, making Ramanujan's ideas (via the Chudnovsky extension) the foundation of all modern π computation.

## Approximations to π

In the same 1914 paper, Ramanujan also gave remarkable algebraic approximations to π. Perhaps the most famous is:

$$\pi \approx \frac{63}{25}\left(\frac{17 + 15\sqrt{5}}{7 + 15\sqrt{5}}\right) = 3.14159265380...$$

which is accurate to 9 decimal places. He also gave:

$$\pi \approx \left(\frac{2143}{22}\right)^{1/4} = 3.14159265258...$$

which is accurate to 8 decimal places. This last approximation, (2143/22)^{1/4}, remains mysterious — no fully satisfactory explanation of how Ramanujan arrived at it has been given.

Another notable approximation from the paper is:

$$e^{\pi\sqrt{163}} \approx 640320^3 + 744$$

The left side equals 262537412640768743.99999999999925..., which is astonishingly close to an integer. This near-integer phenomenon is related to the theory of complex multiplication and Heegner numbers, and it connects directly to the Chudnovsky formula.

## Connection to Ramanujan's Other Work

Ramanujan's π formulas are deeply connected to his other mathematical interests:

- **Modular forms**: The eta function and modular equations that underpin the π series are central objects in Ramanujan's work on modular forms.
- **Hypergeometric series**: The π formulas are special evaluations of generalized hypergeometric series, another area where Ramanujan excelled.
- **Continued fractions**: Some of Ramanujan's π approximations are connected to continued fraction expansions of related quantities.
- **Theta functions**: The Jacobi theta functions that appear in the modular equation framework are related to Ramanujan's extensive work on q-series.

## Proofs and Verification

Ramanujan stated all 17 series without proof. The first rigorous proofs were given by:

- **Borwein brothers** (1987): Proved many of Ramanujan's series using the theory of modular equations in their book *Pi and the AGM*.
- **Berndt and collaborators** (1989–2000s): Systematically proved all of Ramanujan's π series as part of the project to edit Ramanujan's notebooks.
- **Chudnovsky brothers** (1988): Proved their own series and related results.

The proofs confirmed that every one of Ramanujan's 17 formulas was correct — a remarkable testament to his intuition, given that he worked without modern tools and stated results that took decades to verify rigorously.

## Legacy

Ramanujan's π formulas have had an enormous impact:

1. They are the basis of essentially all modern π computation.
2. They revealed deep connections between modular forms, hypergeometric functions, and the geometry of elliptic curves.
3. They inspired the Ramanujan-Sato classification program.
4. They continue to motivate research in number theory, algebraic geometry, and mathematical physics.

Ramanujan's π series stand as one of the most spectacular examples of mathematical beauty serving practical computation.
