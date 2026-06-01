---
topic: Ramanujan's Continued Fractions
type: math
key_terms: continued fractions, Rogers-Ramanujan continued fraction, R(q), q-series, modular forms, Hardy quote, complex variable, partition theory, theta functions, evaluation at special values
---

# Ramanujan's Work on Continued Fractions

## Overview

Continued fractions were one of Ramanujan's greatest areas of mastery. His work in this domain was so extraordinary that G.H. Hardy, himself one of the finest analysts of his generation, confessed that Ramanujan's continued fraction formulas "defeated me completely; I had never seen anything in the least like them before." Hardy made this remark in reference to results Ramanujan communicated in his famous first letter to Hardy in January 1913.

Ramanujan treated continued fractions not merely as curiosities or computational tools but as **functions of a complex variable**, studying their analytic properties, transformations, and connections to modular forms and q-series. His results in this area were decades ahead of their time, and many were not fully understood until the late 20th century.

## Basic Concepts

A **continued fraction** is an expression of the form:

$$a_0 + \cfrac{b_1}{a_1 + \cfrac{b_2}{a_2 + \cfrac{b_3}{a_3 + \cdots}}}$$

which is often written compactly as:

$$a_0 + \frac{b_1}{a_1+} \frac{b_2}{a_2+} \frac{b_3}{a_3+} \cdots$$

When the partial numerators b_i and partial denominators a_i are themselves functions of a variable q or x, the continued fraction defines a function. Ramanujan's genius lay in finding exact evaluations, functional equations, and modular properties of such continued fraction functions.

## The Rogers-Ramanujan Continued Fraction R(q)

The crown jewel of Ramanujan's continued fraction work is the **Rogers-Ramanujan continued fraction**, defined for |q| < 1:

$$R(q) = \cfrac{q^{1/5}}{1 + \cfrac{q}{1 + \cfrac{q^2}{1 + \cfrac{q^3}{1 + \cdots}}}}$$

or equivalently:

$$R(q) = q^{1/5} \frac{(q;q^5)_\infty (q^4;q^5)_\infty}{(q^2;q^5)_\infty (q^3;q^5)_\infty}$$

where (a;q)_∞ = ∏_{n=0}^{∞} (1 - aq^n) is the q-Pochhammer symbol.

This infinite product representation connects R(q) directly to the **Rogers-Ramanujan identities** and to modular forms.

### Properties of R(q)

Ramanujan discovered numerous remarkable properties of R(q):

**1. Modular equation relating R(q) and R(q^5):**

If u = R(q) and v = R(q^5), then:

$$v - u^5 = \frac{u \cdot v (1 - u^5 v^5)}{1 + u^5 + u^5 v^5}$$

**2. Relation between R(q) and R(q²):**

Ramanujan found explicit algebraic relations between R(q) and R(q^n) for various values of n, generalizing modular equations to the continued fraction setting.

**3. Connection to the j-invariant and modular functions:**

The Rogers-Ramanujan continued fraction is a modular function of level 5. Specifically, R(e^{2πiτ}) is a Hauptmodul (principal modulus) for the modular curve X(5), meaning it generates the field of modular functions of level 5.

## Evaluations at Special Values

Ramanujan computed R(q) at special values of q with extraordinary precision. Some of his most famous evaluations include:

**At q = e^{-2π}:**

$$R(e^{-2\pi}) = \sqrt{5} \cdot \frac{\sqrt{5} + 1}{2} - \frac{\sqrt{5} + 1}{2} = \sqrt{\frac{5 + \sqrt{5}}{2}} - \frac{\sqrt{5} + 1}{2}$$

**At q = e^{-2π√5}:**

$$R(e^{-2\pi\sqrt{5}}) = \frac{\sqrt{5}}{1 + \left(5^{3/4}\left(\frac{\sqrt{5}-1}{2}\right)^{5/2} - 1\right)^{1/5}} - \frac{\sqrt{5} - 1}{2}$$

These evaluations, communicated in Ramanujan's first letter to Hardy, were among the results that most astonished Hardy. They demonstrated that Ramanujan could evaluate intricate continued fractions in terms of nested radicals involving the golden ratio φ = (1 + √5)/2.

**At q = -e^{-π}:**

Ramanujan also evaluated R(q) at negative values of q^{1/5}, connecting to the "Ramanujan-Göllnitz-Gordon continued fraction" and related objects.

## Other Important Continued Fractions

### Ramanujan's Cubic Continued Fraction

Ramanujan studied the cubic analogue:

$$C(q) = \cfrac{q^{1/3}}{1 + \cfrac{q + q^2}{1 + \cfrac{q^2 + q^4}{1 + \cfrac{q^3 + q^6}{1 + \cdots}}}}$$

This continued fraction has modular properties analogous to R(q) but at level 3 instead of level 5.

### Ramanujan's General Continued Fraction

In Chapter 12 of his second notebook, Ramanujan recorded a general continued fraction:

$$\cfrac{1}{1 + \cfrac{a \cdot q}{1 + \cfrac{b \cdot q^2}{1 + \cfrac{a \cdot q^3}{1 + \cdots}}}}$$

with parameters a and b, and gave its evaluation in terms of q-series and theta functions.

### The Continued Fraction for e

Ramanujan found beautiful continued fractions related to the exponential function:

$$\frac{e^{2/a} - 1}{e^{2/a} + 1} = \cfrac{1}{a + \cfrac{1}{3a + \cfrac{1}{5a + \cfrac{1}{7a + \cdots}}}}$$

For a = 1, this gives tanh(1) as a simple continued fraction. More generally, Ramanujan used continued fractions to express ratios of Bessel functions and confluent hypergeometric functions.

## Continued Fractions from the Letters to Hardy

In his first letter to Hardy (16 January 1913), Ramanujan included several continued fraction results. Beyond the evaluations of R(q) mentioned above, he stated:

$$\cfrac{1}{1+} \cfrac{e^{-2\pi}}{1+} \cfrac{e^{-4\pi}}{1+} \cdots = \left(\sqrt{\frac{5+\sqrt{5}}{2}} - \frac{\sqrt{5}+1}{2}\right) e^{2\pi/5}$$

Hardy later recalled that this result, along with related ones, convinced him that Ramanujan must be a mathematician "of the highest quality" — for "they must be true because, if they were not true, no one would have had the imagination to invent them."

In his second letter (27 February 1913), Ramanujan provided additional continued fraction evaluations and identities.

## Connection to q-Series and Partition Theory

Ramanujan's continued fractions are intimately connected to partition theory through their q-series representations. The Rogers-Ramanujan continued fraction R(q), for instance, encodes the generating functions for partitions into parts congruent to ±1 (mod 5) and ±2 (mod 5).

More precisely, if we write:

$$R(q) = q^{1/5} \frac{H(q)}{G(q)}$$

where:

$$G(q) = \sum_{n=0}^{\infty} \frac{q^{n^2}}{(q;q)_n} = \prod_{n=0}^{\infty} \frac{1}{(1-q^{5n+1})(1-q^{5n+4})}$$

$$H(q) = \sum_{n=0}^{\infty} \frac{q^{n^2+n}}{(q;q)_n} = \prod_{n=0}^{\infty} \frac{1}{(1-q^{5n+2})(1-q^{5n+3})}$$

then G(q) is the generating function for partitions into parts ≡ 1, 4 (mod 5), and H(q) is the generating function for partitions into parts ≡ 2, 3 (mod 5). These are precisely the Rogers-Ramanujan identities.

## Continued Fractions and Modular Forms

One of Ramanujan's deepest insights was the connection between continued fractions and modular forms. The Rogers-Ramanujan continued fraction R(q) transforms under the modular group in a way that can be described explicitly:

If q = e^{2πiτ}, then R(e^{2πiτ}) satisfies:

$$R(e^{-2\pi/\tau}) = \frac{1 - R(e^{2\pi i \tau}) \cdot \phi}{R(e^{2\pi i \tau}) + \phi}$$

where φ = (√5 - 1)/2 is the golden ratio conjugate. This transformation law connects R(q) to the theory of modular units and allows the evaluation of R(q) at CM (complex multiplication) points.

## Results from the Notebooks

Ramanujan's notebooks (particularly the second and third notebooks) contain hundreds of continued fraction identities. Bruce Berndt's systematic editing of the notebooks (published in five volumes, 1985–1998) revealed the full scope of Ramanujan's work. Key results include:

- **Chapter 12 of the second notebook**: Contains a systematic development of continued fractions, including general theorems and many specific evaluations.
- **Chapter 16**: Contains results on q-continued fractions connected to theta functions.
- **The Lost Notebook**: Contains additional continued fraction identities discovered by Andrews and Berndt during their editing of this manuscript.

Many of these results were new at the time of their rediscovery and required substantial effort to prove rigorously.

## Hardy's Assessment

Hardy's admiration for Ramanujan's continued fraction work was unequivocal. In his 1940 book *Ramanujan*, Hardy wrote:

> "It was his insight into algebraical formulae, transformation of infinite series, and so forth, that was most amazing. On this side most certainly I have never met his equal, and I can compare him only with Euler or Jacobi."

The continued fraction evaluations in particular struck Hardy as utterly mysterious — not because they were wrong, but because he could not fathom how any human mind could have discovered them without the modern theoretical framework that would only be developed decades later.

## Legacy

Ramanujan's continued fraction work has influenced:

1. **Modular function theory**: The Rogers-Ramanujan continued fraction is now understood as a key example of a modular unit.
2. **Partition theory**: Continued fraction methods yield partition identities and congruences.
3. **Approximation theory**: Ramanujan-type continued fractions provide efficient rational approximations.
4. **Mathematical physics**: The Rogers-Ramanujan continued fraction appears in statistical mechanics (hard hexagon model, solved by Baxter in 1980).
5. **Computer algebra**: Many of Ramanujan's continued fraction identities have been verified and extended using modern computational tools.
