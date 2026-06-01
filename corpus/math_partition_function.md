---
topic: partition function
type: math
key_terms: partitions, Hardy-Ramanujan formula, circle method, congruences
---

# The Partition Function

In number theory, a partition of a positive integer $n$ is a way of writing $n$ as a sum of positive integers. The number of partitions of $n$ is denoted by the partition function $p(n)$. For example, $p(4) = 5$ because 4 can be partitioned as: 4, 3+1, 2+2, 2+1+1, 1+1+1+1.

One of Ramanujan's greatest achievements, in collaboration with G. H. Hardy, was finding an asymptotic formula for $p(n)$. Before their work, it was incredibly difficult to compute $p(n)$ for large values like $n=200$.

## The Hardy-Ramanujan Asymptotic Formula

Published in 1918, the Hardy-Ramanujan asymptotic formula states:

$$p(n) \sim \frac{1}{4n\sqrt{3}} \exp\left(\pi\sqrt{\frac{2n}{3}}\right)$$

To prove this, Hardy and Ramanujan invented a powerful new technique in analytic number theory known as the **circle method**. Their exact series expansion was so remarkably accurate that it yielded $p(200) = 3,972,999,029,388$ precisely.

## Ramanujan's Congruences

Ramanujan also discovered beautiful congruence properties for the partition function. He noticed these by observing a table of $p(n)$ values constructed by Major P. A. MacMahon. Ramanujan proved that:

- $p(5n+4) \equiv 0 \pmod 5$
- $p(7n+5) \equiv 0 \pmod 7$
- $p(11n+6) \equiv 0 \pmod{11}$

He summarized this in his notebooks, demonstrating a deep intuition for the modular properties of the generating function of $p(n)$.
