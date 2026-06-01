---
topic: Rogers-Ramanujan Identities
type: math
key_terms: Rogers-Ramanujan identities, infinite product, infinite series, partition identities, combinatorial interpretation, statistical mechanics, conformal field theory, Lie algebras, Baxter hard hexagon model, q-series
---

# The Rogers-Ramanujan Identities

## Overview

The Rogers-Ramanujan identities are two remarkable equalities between infinite series and infinite products. They are among the most beautiful and influential identities in all of mathematics, connecting combinatorics, number theory, algebra, and mathematical physics. Ramanujan discovered them independently around 1913, unaware that L.J. Rogers had first published them in 1894 in a paper that had been largely overlooked.

## Exact Statements

The two Rogers-Ramanujan identities are:

### First Rogers-Ramanujan Identity

$$G(q) = \sum_{n=0}^{\infty} \frac{q^{n^2}}{(q;q)_n} = \prod_{n=0}^{\infty} \frac{1}{(1-q^{5n+1})(1-q^{5n+4})} = \frac{1}{(q;q^5)_\infty (q^4;q^5)_\infty}$$

for |q| < 1, where (q;q)_n = (1-q)(1-q^2)···(1-q^n) is the q-Pochhammer symbol.

### Second Rogers-Ramanujan Identity

$$H(q) = \sum_{n=0}^{\infty} \frac{q^{n^2+n}}{(q;q)_n} = \prod_{n=0}^{\infty} \frac{1}{(1-q^{5n+2})(1-q^{5n+3})} = \frac{1}{(q^2;q^5)_\infty (q^3;q^5)_\infty}$$

for |q| < 1.

In both identities, the left side is an infinite sum involving q raised to quadratic powers (n² or n²+n), and the right side is an infinite product with factors involving fifth powers. The appearance of 5 in the product side is deeply significant and connects to the theory of modular forms of level 5.

## Historical Discovery

### Rogers' Original Discovery (1894)

Leonard James Rogers, a professor at the University of Leeds, first proved these identities in his 1894 paper "Second Memoir on the Expansion of Certain Infinite Products" published in the *Proceedings of the London Mathematical Society*. Rogers' proof used iterative methods and functional equations, but the paper was dense and attracted little attention. The identities lay essentially forgotten for nearly two decades.

### Ramanujan's Independent Rediscovery (c. 1910–1913)

Ramanujan discovered the identities independently, apparently around 1910–1913, during his self-directed studies in India before contacting Hardy. He recorded them in his notebooks (specifically in Chapter 16 of the second notebook) but initially did not have proofs of them. In his first letter to Hardy (16 January 1913), Ramanujan stated related results involving the Rogers-Ramanujan continued fraction.

When Ramanujan arrived in England in 1914, he showed the identities to Hardy and other Cambridge mathematicians. None of them could prove them, and the identities were thought to be new. It was only when Ramanujan came across Rogers' 1894 paper (reportedly by browsing old volumes of the *Proceedings*) that he realized the results had been previously discovered.

### The Joint Proof (1919)

Once Rogers' priority was established, Ramanujan contacted Rogers, and the two mathematicians collaborated on a new, simplified proof. Their joint paper, "Proof of certain identities in combinatory analysis," was published in the *Proceedings of the Cambridge Philosophical Society*, vol. 19 (1919), pp. 211–216. This proof was significantly more transparent than Rogers' original argument.

Independently, Issai Schur in Germany also discovered and proved the identities in 1917, using a completely different combinatorial approach, unaware of either Rogers' or Ramanujan's work (communication had been disrupted by World War I).

## Combinatorial Interpretations

The Rogers-Ramanujan identities have beautiful combinatorial interpretations in terms of integer partitions:

### First Identity — Combinatorial Interpretation

The first identity states: **The number of partitions of n into parts where consecutive parts differ by at least 2 equals the number of partitions of n into parts congruent to 1 or 4 modulo 5.**

For example, for n = 9:
- Partitions with parts differing by ≥ 2: {9}, {8+1}, {7+2}, {6+3}, {6+2+1}, {5+3+1}, {4+3+2} — 7 partitions.
- Partitions into parts ≡ 1 or 4 (mod 5), i.e., parts from {1, 4, 6, 9, 11, 14, ...}: {9}, {6+1+1+1}, {4+4+1}, {4+1+1+1+1+1}, {6+1+1+1}, {1+1+1+1+1+1+1+1+1}, {4+4+1} — 7 partitions.

(The exact count requires careful enumeration, but the theorem guarantees equality for all n.)

### Second Identity — Combinatorial Interpretation

The second identity states: **The number of partitions of n into parts where consecutive parts differ by at least 2 and the smallest part is at least 2 equals the number of partitions of n into parts congruent to 2 or 3 modulo 5.**

### Why These Interpretations Hold

The **series side** G(q) = Σ q^{n²}/(q;q)_n generates partitions where the parts differ by at least 2. This can be seen by noting that if we write a partition λ₁ ≥ λ₂ ≥ ... ≥ λ_k with λᵢ - λᵢ₊₁ ≥ 2, then the substitution λᵢ = μᵢ + 2(k-i) transforms these into unrestricted partitions μ₁ ≥ μ₂ ≥ ... ≥ μ_k ≥ 0, and the generating function becomes q^{k²}/(q;q)_k after accounting for the shift.

The **product side** 1/((q;q⁵)_∞(q⁴;q⁵)_∞) is the generating function for partitions into parts ≡ 1 or 4 (mod 5), since each factor 1/(1-qᵐ) contributes unrestricted multiplicity for the part m.

## Connection to the Rogers-Ramanujan Continued Fraction

The ratio H(q)/G(q) is directly related to the Rogers-Ramanujan continued fraction:

$$R(q) = q^{1/5} \frac{H(q)}{G(q)} = \cfrac{q^{1/5}}{1 + \cfrac{q}{1 + \cfrac{q^2}{1 + \cfrac{q^3}{1 + \cdots}}}}$$

This connection was central to Ramanujan's work and links the combinatorial identities to the modular function theory of the continued fraction.

## Applications in Statistical Mechanics

The Rogers-Ramanujan identities found a spectacular application in physics when Rodney Baxter solved the **hard hexagon model** in 1980.

### The Hard Hexagon Model

The hard hexagon model is a lattice gas model in two-dimensional statistical mechanics where particles sit on the vertices of a triangular lattice with the constraint that no two adjacent vertices can be simultaneously occupied. Baxter showed that the partition function (in the statistical mechanics sense) of this model can be expressed in terms of the Rogers-Ramanujan products:

$$\kappa = \frac{G(q)^5 \cdot q^{-1/60}}{(q;q)_\infty} \quad \text{(subcritical regime)}$$

$$\kappa = \frac{H(q)^5 \cdot q^{11/60}}{(q;q)_\infty} \quad \text{(supercritical regime)}$$

where κ is the per-site partition function and q is related to the fugacity.

This result was a complete surprise — nobody had expected that identities from 19th-century combinatorics would appear in the exact solution of a physically important model. It earned Baxter the Boltzmann Medal and brought the Rogers-Ramanujan identities to the attention of the physics community.

## Applications in Conformal Field Theory

In conformal field theory (CFT), the Rogers-Ramanujan identities appear in the character formulas for representations of the **Virasoro algebra** at central charge c = 2/5. The characters of the minimal model M(2,5) are:

$$\chi_0(q) = q^{-1/60} G(q) / (q;q)_\infty$$
$$\chi_1(q) = q^{11/60} H(q) / (q;q)_\infty$$

These characters count states in the conformal field theory and satisfy modular transformation properties that are essential for the consistency of the theory on a torus.

## Connection to Lie Algebras and Representation Theory

The Rogers-Ramanujan identities are connected to the representation theory of affine Lie algebras, specifically:

- They arise as special cases of the **Lepowsky-Wilson interpretation** (1984) using vertex operator algebras associated with the affine Lie algebra A₁⁽¹⁾.
- They are related to the **principal characters** of certain standard modules of affine Lie algebras.
- The **Lepowsky-Milne** observation (1978) connected the identities to the Macdonald identities for affine root systems.

These algebraic connections have led to a rich theory of **Rogers-Ramanujan-type identities** associated with various Lie algebras and vertex algebras.

## Generalizations

Numerous generalizations of the Rogers-Ramanujan identities have been discovered:

### Andrews-Gordon Identities

George Andrews (1974) and Basil Gordon (1961) independently generalized the Rogers-Ramanujan identities to moduli other than 5. The Andrews-Gordon identities involve partitions with difference conditions at modulus 2k+1 (the original Rogers-Ramanujan identities correspond to k=2).

### Bressoud's Identities

David Bressoud extended the Andrews-Gordon identities to even moduli.

### The A₂ Rogers-Ramanujan Identities

Andrews, Schilling, and Warnaar (1999) found analogues associated with the Lie algebra A₂, involving colored partitions.

## Proofs

Over the years, many different proofs of the Rogers-Ramanujan identities have been given:

1. **Rogers (1894)**: Original proof using iterative functional equations.
2. **Rogers-Ramanujan (1919)**: Simplified proof using series manipulations.
3. **Schur (1917)**: Combinatorial proof using difference conditions on partitions.
4. **Watson (1929)**: Proof using Bailey's transformation of basic hypergeometric series.
5. **Andrews (1970s)**: Multiple proofs using Bailey chains and Bailey pairs.
6. **Lepowsky-Wilson (1984)**: Proof using vertex operator algebras.
7. **Garsia-Milne (1981)**: Bijective proof establishing the combinatorial interpretation directly.

The variety of proof methods reflects the depth and interconnectedness of the identities.

## Significance

The Rogers-Ramanujan identities stand at a remarkable crossroads of mathematics and physics. They connect:
- **Combinatorics**: Integer partitions with difference and congruence conditions.
- **Analysis**: q-series and basic hypergeometric functions.
- **Algebra**: Lie algebras, vertex algebras, and representation theory.
- **Number theory**: Modular forms and modular functions.
- **Physics**: Statistical mechanics and conformal field theory.

Few mathematical identities can claim such breadth of application, and they remain an active area of research more than a century after their discovery.
