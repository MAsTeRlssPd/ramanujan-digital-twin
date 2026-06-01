---
topic: Ramanujan's Work on Modular Forms
type: math
key_terms: modular forms, modular equations, Ramanujan tau function, tau conjecture, Deligne proof, Delta function, discriminant function, eta function, class invariants, singular moduli, cusp forms, Hecke operators
---

# Ramanujan's Work on Modular Forms

## Overview

Modular forms are among the most important objects in modern mathematics, lying at the intersection of number theory, algebraic geometry, and mathematical physics. Ramanujan made profound contributions to the theory of modular forms, often decades before the full theoretical framework was available. His work on modular equations, the tau function, the discriminant function, eta function identities, and class invariants constitutes some of his deepest and most far-reaching mathematics.

## Modular Equations

### Definition

A **modular equation of degree n** is an algebraic relation between the modular invariant k² (or related quantities) at the arguments q and q^n. More precisely, if K and K' are the complete elliptic integrals of the first kind with modulus k, and if we define:

$$q = e^{-\pi K'/K}$$

then a modular equation of degree n relates k and the modulus l for which:

$$n \frac{K'(k)}{K(k)} = \frac{K'(l)}{K(l)}$$

Equivalently, modular equations relate the values of modular functions at τ and nτ.

### Ramanujan's Contributions

Ramanujan discovered modular equations of an extraordinary range of degrees. In his notebooks (particularly the second notebook), he recorded modular equations of degrees 2, 3, 5, 7, 11, 13, 15, 17, 19, 23, 25, 29, 31, and many composite degrees. Some highlights:

**Degree 5 modular equation:**
If α and β are related by a modular equation of degree 5, and we set u = α^{1/4} and v = β^{1/4}, then:

$$u^4 - v^4 + 5u^2v^2(u^4 - v^4) = 2uv(1 - u^4v^4)$$

(This is a simplified form; Ramanujan gave multiple equivalent formulations.)

**Degree 7 modular equation:**
Ramanujan's modular equation of degree 7 involves algebraic relations of degree 8 in the appropriate variables. These equations become increasingly complex with higher degrees, and Ramanujan's ability to discover them was considered almost superhuman by his contemporaries.

**Higher degree equations:**
Ramanujan found modular equations of degrees as high as 29 and 31, which are extraordinarily complex algebraic relations. Hardy noted that these equations, while stated without proof, were invariably correct when verified.

### Connection to Pi Formulas

Ramanujan's modular equations are the key ingredient in his famous series for 1/π. The rapidly converging series for π arise from evaluating hypergeometric functions at **singular moduli** — special values of the modular invariant where the associated elliptic curve has complex multiplication. The modular equations allow these singular moduli to be computed as algebraic numbers.

## The Ramanujan Tau Function

### Definition

The **Ramanujan tau function** τ(n) is defined as the coefficient of q^n in the expansion of the **discriminant function** (or Ramanujan's Delta function):

$$\Delta(z) = q \prod_{n=1}^{\infty} (1-q^n)^{24} = \sum_{n=1}^{\infty} \tau(n) q^n$$

where q = e^{2πiz} and z is in the upper half-plane.

The first several values of τ(n) are:

| n | τ(n) |
|---|------|
| 1 | 1 |
| 2 | -24 |
| 3 | 252 |
| 4 | -1472 |
| 5 | 4830 |
| 6 | -6048 |
| 7 | -16744 |
| 8 | 84480 |
| 9 | -113643 |
| 10 | -115920 |
| 11 | 534612 |
| 12 | -370944 |

### Properties Discovered by Ramanujan

Ramanujan discovered several fundamental properties of τ(n):

**1. Multiplicativity**: Ramanujan conjectured that τ(n) is multiplicative, meaning:
- τ(mn) = τ(m)τ(n) when gcd(m,n) = 1
- τ(p^{a+1}) = τ(p)τ(p^a) - p^{11}τ(p^{a-1}) for primes p

This multiplicativity was proved by Mordell in 1917 using what are now called Hecke operators, shortly after Ramanujan announced the conjecture. The general theory was developed by Hecke in the 1930s.

**2. The Ramanujan Conjecture (Ramanujan-Petersson Conjecture)**:

Ramanujan conjectured in 1916 that for every prime p:

$$|\tau(p)| \leq 2p^{11/2}$$

This bound, known as the **Ramanujan conjecture**, was one of the most important open problems in number theory for over half a century. It was finally proved by **Pierre Deligne in 1974** as a consequence of his proof of the Weil conjectures, using deep tools from algebraic geometry (étale cohomology and l-adic representations). Deligne's proof earned him the Fields Medal in 1978.

The Ramanujan conjecture generalizes to the **Ramanujan-Petersson conjecture** for arbitrary cusp forms, which remains unproved in full generality for Maass forms.

**3. Divisibility properties**: Ramanujan observed various congruences satisfied by τ(n), including:
- τ(n) ≡ σ₁₁(n) (mod 691)
- τ(n) ≡ n²σ₇(n) (mod 25)
- τ(n) ≡ nσ₃(n) (mod 7)

where σ_k(n) = Σ_{d|n} d^k is the sum of k-th powers of divisors. The congruence modulo 691 is particularly striking because 691 is the numerator of the Bernoulli number B₁₂/12.

**4. Non-vanishing**: Ramanujan conjectured that τ(n) ≠ 0 for all n. This conjecture, known as **Lehmer's conjecture** (after D.H. Lehmer who publicized it), remains open as of 2024, though it has been verified computationally for all n up to very large bounds.

## The Delta Function Δ(z)

### Properties

The discriminant function Δ(z) is the unique normalized cusp form of weight 12 for the full modular group SL₂(ℤ). Its key properties include:

**1. Modularity**: For any matrix (a b; c d) ∈ SL₂(ℤ):

$$\Delta\left(\frac{az+b}{cz+d}\right) = (cz+d)^{12} \Delta(z)$$

**2. Product formula**: Δ(z) = q ∏(1-q^n)^{24}, connecting it to the Dedekind eta function.

**3. No zeros**: Δ(z) has no zeros in the upper half-plane, only a simple zero at the cusp ∞. This makes it useful for constructing other modular forms.

**4. Relation to Eisenstein series**: Δ(z) = (E₄(z)³ - E₆(z)²)/1728, where E₄ and E₆ are Eisenstein series.

### Ramanujan's Study

Ramanujan studied Δ(z) extensively, both through its product formula and through the arithmetic properties of its coefficients τ(n). He was the first to systematically investigate the multiplicative structure of the Fourier coefficients of modular forms, a study that became the foundation for Hecke's theory.

## The Dedekind Eta Function

### Definition and Ramanujan's Identities

The **Dedekind eta function** is defined as:

$$\eta(z) = q^{1/24} \prod_{n=1}^{\infty} (1-q^n)$$

where q = e^{2πiz}. It is related to the Delta function by Δ(z) = η(z)^{24}.

Ramanujan discovered numerous identities involving the eta function and its quotients. These **eta quotients** are functions of the form:

$$f(z) = \prod_{\delta | N} \eta(\delta z)^{r_\delta}$$

for integers r_δ. Ramanujan found conditions under which such products are modular forms and gave many specific examples.

### Notable Eta Function Identities

Some of Ramanujan's eta function identities include:

**Quintuple product identity**: Ramanujan independently discovered the quintuple product identity:

$$\prod_{n=1}^{\infty}(1-q^n)(1-zq^{n-1})(1-z^{-1}q^n)(1-z^2q^{2n-1})(1-z^{-2}q^{2n-1})$$

which equals a sum of theta-function type expressions.

**Eta function at different arguments**: Ramanujan found relations such as:

$$\frac{\eta(5z)^6}{\eta(z)^6} + 11 + 5^3 \frac{\eta(z)^6}{\eta(5z)^6} = \left(\frac{\eta(z)^6}{\eta(5z)^6}\right) \cdot \text{(modular polynomial)}$$

These identities played a crucial role in his partition congruences modulo 5, 7, and 11.

## Class Invariants and Singular Moduli

### Class Invariants

Ramanujan computed extensive tables of **class invariants** G_n and g_n, which are algebraic numbers defined in terms of the modular function at quadratic irrationalities:

$$G_n = 2^{-1/4} q^{-1/24} \prod_{k=0}^{\infty}(1 + q^{2k+1})$$

$$g_n = 2^{-1/4} q^{-1/24} \prod_{k=0}^{\infty}(1 - q^{2k+1})$$

where q = e^{-π\sqrt{n}}.

Ramanujan computed G_n and g_n for hundreds of values of n, recording them in his notebooks. These computations were essential for his π formulas, as the algebraic constants in those series (like 1103, 26390, 9801, 396) are derived from class invariants at specific values of n.

### Singular Moduli

The **singular modulus** k_N is the value of the elliptic modular function λ(τ) at τ = i√N. Ramanujan computed singular moduli for many values of N and used them in constructing modular equations and π series.

## Connection to Other Areas of Ramanujan's Work

Ramanujan's modular form work is deeply interconnected with his other contributions:

1. **Partition function**: The generating function for p(n) involves 1/η(z), and the modular properties of η are essential for the Hardy-Ramanujan circle method.
2. **Pi formulas**: Arise from evaluating modular forms at CM points.
3. **Mock theta functions**: Are holomorphic parts of harmonic Maass forms — a generalization of modular forms.
4. **Rogers-Ramanujan identities**: The functions G(q) and H(q) are related to modular functions of level 5.
5. **Continued fractions**: The Rogers-Ramanujan continued fraction is a modular function.

## Publication History

Ramanujan's modular form results appeared in:
- **"Modular equations and approximations to π"** (QJM, 1914): Modular equations and π series.
- **"On certain arithmetical functions"** (Transactions of the Cambridge Philosophical Society, 1916): The tau function, its multiplicativity, and congruences.
- **The notebooks**: Volumes of modular equations, class invariants, and eta function identities, edited by Berndt (1985–1998).
- **The Lost Notebook**: Additional modular identities, edited by Andrews and Berndt (2005–2018).

## Legacy

Ramanujan's work on modular forms was foundational for:
- **Hecke theory**: The systematic study of multiplicative properties of modular form coefficients.
- **The Langlands program**: The Ramanujan conjecture is a key case of the general Langlands conjectures.
- **The proof of Fermat's Last Theorem**: Wiles' proof (1995) relies on the modularity of elliptic curves, a descendant of ideas originating with modular forms.
- **Modern number theory**: Modular forms remain central to research in arithmetic geometry, automorphic forms, and related areas.

Ramanujan's intuitive grasp of modular form theory — decades before the abstract framework was developed — remains one of the most remarkable aspects of his mathematical legacy.
