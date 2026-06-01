---
topic: Highly Composite Numbers
type: math
key_terms: highly composite numbers, divisor function, prime factorization, superior highly composite numbers, Riemann hypothesis, Hardy editing, anti-primes, colossally abundant numbers, 1915 paper, Proceedings London Mathematical Society
---

# Highly Composite Numbers

## Definition

A positive integer n is called a **highly composite number** if it has more divisors than any positive integer smaller than it. In other words, n is highly composite if d(n) > d(m) for all positive integers m < n, where d(k) denotes the number of positive divisors of k.

Highly composite numbers are, in a sense, the "opposite" of primes: while primes have the fewest possible divisors (exactly 2), highly composite numbers have a record-breaking number of divisors relative to their size. They are sometimes informally called **anti-primes**.

## The Sequence of Highly Composite Numbers

The first several highly composite numbers are:

| n | d(n) | Prime Factorization |
|---|------|-------------------|
| 1 | 1 | 1 |
| 2 | 2 | 2 |
| 4 | 3 | 2² |
| 6 | 4 | 2 × 3 |
| 12 | 6 | 2² × 3 |
| 24 | 8 | 2³ × 3 |
| 36 | 9 | 2² × 3² |
| 48 | 10 | 2⁴ × 3 |
| 60 | 12 | 2² × 3 × 5 |
| 120 | 16 | 2³ × 3 × 5 |
| 180 | 18 | 2² × 3² × 5 |
| 240 | 20 | 2⁴ × 3 × 5 |
| 360 | 24 | 2³ × 3² × 5 |
| 720 | 30 | 2⁴ × 3² × 5 |
| 1260 | 36 | 2² × 3² × 5 × 7 |
| 1680 | 40 | 2⁴ × 3 × 5 × 7 |
| 2520 | 48 | 2³ × 3² × 5 × 7 |
| 5040 | 60 | 2⁴ × 3² × 5 × 7 |

The numbers 1, 2, 4, 6, 12, 24, 36, 48, 60, 120, 180, 240, 360, 720, 1260, 1680, 2520, 5040, ... form an infinite sequence. Many of these numbers appear naturally in everyday life and mathematics — 12 (dozen), 24 (hours), 60 (minutes/seconds), 360 (degrees), and 5040 = 7! (which Plato considered the ideal number of citizens for a city-state).

## Ramanujan's 1915 Paper

Ramanujan published his study of highly composite numbers as "Highly Composite Numbers" in the *Proceedings of the London Mathematical Society*, Series 2, Volume 14, pages 347–409 (1915). This was one of Ramanujan's longest papers and represented a thorough investigation into the structure of these numbers.

### The Original Manuscript

Ramanujan's original manuscript was significantly longer than the published version — reportedly over 100 pages. Hardy edited the paper substantially for publication, removing some sections that he deemed too long or insufficiently rigorous. The excised portions dealt primarily with what Ramanujan called "superior highly composite numbers" (see below) and included deeper results connecting to the Riemann hypothesis.

The unpublished portions of the manuscript were rediscovered among Ramanujan's papers and were later published by Jean-Louis Nicolas and Guy Robin in 1997 in *The Ramanujan Journal*, vol. 1, pp. 119–153, under the title "Highly Composite Numbers by Srinivasa Ramanujan" — annotated with the parts that Hardy had removed.

## Properties Ramanujan Proved

### Prime Factorization Structure

Ramanujan proved several fundamental properties of highly composite numbers:

**1. Consecutive primes**: If N is highly composite and N = 2^{a₂} × 3^{a₃} × 5^{a₅} × ... × p^{aₚ}, then the prime factors of N must be consecutive primes starting from 2. That is, if p is a prime factor of N, then every prime less than p must also be a prime factor of N.

**2. Decreasing exponents**: The exponents in the prime factorization must be non-increasing: a₂ ≥ a₃ ≥ a₅ ≥ ... ≥ aₚ. That is, smaller primes appear with at least as high an exponent as larger primes.

**3. Terminal exponent**: The largest prime factor p of a highly composite number (except for 4 and 36) has exponent aₚ = 1.

**4. Exponent bounds**: For each prime q dividing N, the exponent a_q satisfies:

$$a_q \approx \frac{\log 2}{\log q} \cdot \frac{\log N}{\log 2} \cdot \text{(correction terms)}$$

More precisely, Ramanujan gave sharp bounds on the exponents in terms of the size of N and the prime q.

### Number of Highly Composite Numbers

Ramanujan showed that the number of highly composite numbers up to x, denoted Q(x), satisfies:

$$Q(x) \sim C \cdot (\log x)^2$$

for a constant C, as x → ∞. This means highly composite numbers become increasingly sparse, much like primes but with a different density law.

### Divisor Function Bounds

For highly composite numbers N, Ramanujan established that:

$$d(N) = 2^{(1+o(1)) \log N / \log \log N}$$

This shows that the maximum order of the divisor function grows like an exponential in log N / log log N.

## Superior Highly Composite Numbers

Ramanujan also introduced and studied a related concept: **superior highly composite numbers**. A positive integer n is a superior highly composite number if there exists ε > 0 such that:

$$\frac{d(n)}{n^\varepsilon} \geq \frac{d(m)}{m^\varepsilon} \quad \text{for all positive integers } m$$

In other words, n maximizes the ratio d(m)/m^ε for some ε > 0.

Every superior highly composite number is highly composite, but not conversely. The superior highly composite numbers form a sparser subsequence:

2, 6, 12, 60, 120, 360, 2520, 5040, 55440, 720720, ...

Ramanujan gave a complete characterization of superior highly composite numbers: they are exactly the numbers of the form:

$$N = \prod_{p \leq P} p^{a_p}$$

where the exponent of each prime p is:

$$a_p = \left\lfloor \frac{1}{p^\varepsilon - 1} \right\rfloor$$

for an appropriate parameter ε > 0, and P is the largest prime for which a_p ≥ 1.

Superior highly composite numbers are also called **colossally abundant numbers** in some modern references, though this term is more precisely applied to a related concept involving the sum-of-divisors function σ(n) rather than the number-of-divisors function d(n).

## Connection to the Riemann Hypothesis

One of the most remarkable aspects of Ramanujan's work on highly composite numbers is its connection to the **Riemann hypothesis** (RH).

### Robin's Inequality

Guy Robin proved in 1984 that the Riemann hypothesis is equivalent to the statement:

$$\sigma(n) < e^\gamma n \log \log n \quad \text{for all } n > 5040$$

where σ(n) is the sum of divisors of n, and γ ≈ 0.5772 is the Euler-Mascheroni constant.

The number 5040 = 7! is itself a highly composite number, and the only exceptions to Robin's inequality (for n ≤ 5040) include several highly composite numbers. Ramanujan's unpublished work (the portions Hardy excised) contained results closely related to Robin's inequality.

### Ramanujan's Unpublished Results

In the excised portions of his manuscript, Ramanujan studied the function:

$$\frac{\sigma(n)}{n \log \log n}$$

for highly composite numbers and obtained estimates that, with modern methods, can be related to the truth or falsity of the Riemann hypothesis. Specifically, Ramanujan showed that if the Riemann hypothesis is true, then certain upper bounds on σ(N)/N hold for superior highly composite numbers N, and conversely.

These results anticipated work by Gronwall (1913), Robin (1984), and Lagarias (2002), who proved that the Riemann hypothesis is equivalent to:

$$\sigma(n) \leq H_n + \exp(H_n) \log(H_n) \quad \text{for all } n \geq 1$$

where H_n = 1 + 1/2 + 1/3 + ... + 1/n is the n-th harmonic number.

## Hardy's Editing

Hardy's decision to cut Ramanujan's paper was pragmatic — the full manuscript was very long and some parts lacked the level of rigor expected in British mathematical journals. However, the excised material contained some of Ramanujan's deepest insights, including the connections to the Riemann hypothesis.

Hardy later expressed some regret about the cuts. The full paper, as Ramanujan originally conceived it, was one of his most sustained and systematic investigations, in contrast to his more typical style of stating results without extensive development.

## Related Concepts

### Colossally Abundant Numbers

A number n is **colossally abundant** if there exists ε > 0 such that σ(n)/n^{1+ε} ≥ σ(m)/m^{1+ε} for all m. These are the analogues of superior highly composite numbers for the sum-of-divisors function. The sequence begins: 2, 6, 12, 60, 120, 360, 2520, 5040, 55440, 720720, ...

### Largely Composite Numbers

A number n is **largely composite** if d(n) ≥ d(m) for all m ≤ n (note the non-strict inequality, unlike highly composite numbers). Every highly composite number is largely composite.

## Context in Ramanujan's Work

The study of highly composite numbers illustrates a distinctive aspect of Ramanujan's mathematical personality. While much of his work focused on identities, series, and formulas, the highly composite number paper shows his capacity for systematic, structural investigation. He was fascinated by the "extreme" behavior of arithmetic functions — how large can d(n) be? How do the numbers achieving these extremes behave?

This paper was also notable as one of Ramanujan's first publications in a major European journal, appearing in 1915 during his early years at Cambridge. It demonstrated to the British mathematical community that Ramanujan could produce not only startling formulas but also sustained mathematical arguments.

## Legacy

Ramanujan's work on highly composite numbers has had lasting influence:

1. It established the structural theory of highly composite numbers that remains the foundation of the subject.
2. The connection to the Riemann hypothesis (through Robin's inequality and related results) keeps the subject relevant to one of the deepest open problems in mathematics.
3. Highly composite numbers appear in algorithm design, coding theory, and optimization problems where numbers with many divisors are needed.
4. The concept has inspired generalizations to other arithmetic functions and to algebraic number fields.
