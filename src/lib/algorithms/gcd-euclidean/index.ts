import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface GCDState {
  a: number;
  b: number;
  steps: Array<{ a: number; b: number; remainder: number; quotient: number }>;
  currentStep: number;
  result: number | null;
}

type GCDInput = { a: number; b: number };

function generateSteps(input: GCDInput): AlgorithmStep<GCDState>[] {
  const steps: AlgorithmStep<GCDState>[] = [];
  const history: GCDState["steps"] = [];

  let a = input.a;
  let b = input.b;

  // Init step
  steps.push({
    description: `gcd(${a}, ${b}). Apply Euclidean algorithm: repeatedly replace (a, b) with (b, a mod b).`,
    state: {
      a,
      b,
      steps: [],
      currentStep: -1,
      result: null,
    },
    highlights: {},
    variables: { a, b },
  });

  let stepIndex = 0;
  while (b !== 0) {
    const quotient = Math.floor(a / b);
    const remainder = a % b;

    const entry = { a, b, remainder, quotient };
    history.push(entry);

    steps.push({
      description: `a = ${a}, b = ${b}. ${a} = ${quotient}×${b} + ${remainder}. Replace (${a}, ${b}) → (${b}, ${remainder}).`,
      state: {
        a,
        b,
        steps: [...history],
        currentStep: stepIndex,
        result: null,
      },
      highlights: {
        [`step_${stepIndex}`]: "active",
      },
      variables: {
        a,
        b,
        quotient,
        remainder,
        nextA: b,
        nextB: remainder,
      },
    });

    a = b;
    b = remainder;
    stepIndex++;
  }

  // Final step: b === 0
  steps.push({
    description: `b = 0, algorithm complete. gcd = ${a}.`,
    state: {
      a,
      b,
      steps: [...history],
      currentStep: stepIndex,
      result: a,
    },
    highlights: Object.fromEntries(
      history.map((_, i) => [`step_${i}`, "sorted" as const])
    ),
    variables: { result: a },
  });

  return steps;
}

export const gcdEuclidean: AlgorithmDefinition<GCDInput, GCDState> = {
  slug: "gcd-euclidean",
  name: "GCD — Euclidean Algorithm",
  category: "math",
  difficulty: "beginner",
  tags: ["math", "number-theory", "gcd", "euclidean", "iterative"],
  summary:
    "Compute the greatest common divisor of two integers in O(log min(a,b)) by repeatedly replacing the larger number with the remainder of dividing it by the smaller.",

  description: `The Euclidean Algorithm is one of the oldest known algorithms, described by Euclid around 300 BCE, yet it remains the standard method for computing the **greatest common divisor (GCD)** in modern software. The core insight is a divisibility invariant: gcd(a, b) = gcd(b, a mod b). Because the remainder a mod b is strictly smaller than b, the pair (a, b) shrinks with every iteration, and the algorithm is guaranteed to terminate when b reaches zero, at which point a holds the GCD.

The convergence rate is remarkably fast. By Lamé's theorem, the number of iterations is bounded by five times the number of decimal digits in the smaller input — or more precisely, O(log min(a, b)). This logarithmic complexity makes the algorithm practical even for very large integers (hundreds of digits), as used in cryptographic key generation. The iterative formulation used here avoids call-stack allocation and is straightforward to implement in any language or hardware, making it a preferred choice over the recursive form in embedded systems and safety-critical applications.

The Euclidean Algorithm is the foundation of the **Extended Euclidean Algorithm**, which additionally computes Bézout coefficients x and y such that ax + by = gcd(a, b). This extension is essential in modular arithmetic: it computes the modular inverse of a number, which is the central operation in RSA encryption and elliptic-curve cryptography. Beyond cryptography, the algorithm appears whenever integer ratios must be reduced to lowest terms — in font rasterizers, media decoders computing aspect ratios, and compilers performing constant folding on rational expressions.`,

  realWorldUsage: [
    {
      system: "RSA and elliptic-curve cryptography libraries (OpenSSL, BoringSSL)",
      useCase: "Modular inverse computation for private key generation",
      why: "RSA key generation requires computing the modular inverse of the public exponent e modulo φ(n). The Extended Euclidean Algorithm — a direct extension of the algorithm visualized here — computes this inverse in O(log n) steps. Every TLS handshake on the internet ultimately depends on this algorithm.",
    },
    {
      system: "Compiler front-ends and constant-folding passes",
      useCase: "Fraction simplification in rational constant arithmetic",
      why: "Compilers that support rational literals or symbolic constant folding (e.g., GHC for Haskell, Julia's type system) reduce fractions like 12/8 to 3/2 by computing gcd(12, 8) = 4 and dividing both terms. The Euclidean Algorithm is the standard primitive used in the compiler's internal arithmetic library.",
    },
    {
      system: "Media frameworks (FFmpeg, GStreamer, Apple AVFoundation)",
      useCase: "Aspect ratio and sample rate normalization",
      why: "Video containers store frame dimensions and sample rates as integer ratios. When transcoding or displaying media, frameworks reduce 1920/1080 → 16/9 and 44100/48000 → 147/160 using gcd() to find the canonical form. FFmpeg's av_reduce() calls gcd internally on every stream open.",
    },
  ],

  complexity: {
    time: {
      best: "O(log min(a,b))",
      average: "O(log min(a,b))",
      worst: "O(log min(a,b))",
    },
    space: "O(1)",
  },

  related: ["sieve-of-eratosthenes"],
  implemented: true,
  defaultInput: { a: 48, b: 18 },
  generateSteps,

  code: {
    typescript: `function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// Extended Euclidean — also returns Bézout coefficients
function extendedGcd(
  a: number,
  b: number
): { gcd: number; x: number; y: number } {
  if (b === 0) return { gcd: a, x: 1, y: 0 };
  const { gcd, x, y } = extendedGcd(b, a % b);
  return { gcd, x: y, y: x - Math.floor(a / b) * y };
}

console.log(gcd(48, 18));   // 6
console.log(gcd(100, 75));  // 25
console.log(extendedGcd(35, 15)); // { gcd: 5, x: 1, y: -2 }`,

    go: `package main

import "fmt"

func gcd(a, b int) int {
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

// Extended Euclidean — also returns Bézout coefficients x, y
// such that a*x + b*y = gcd(a, b)
func extendedGcd(a, b int) (g, x, y int) {
	if b == 0 {
		return a, 1, 0
	}
	g, x1, y1 := extendedGcd(b, a%b)
	return g, y1, x1 - (a/b)*y1
}

func main() {
	fmt.Println(gcd(48, 18))          // 6
	fmt.Println(gcd(100, 75))         // 25
	g, x, y := extendedGcd(35, 15)
	fmt.Printf("gcd=%d, x=%d, y=%d\\n", g, x, y) // gcd=5, x=1, y=-2
}`,

    rust: `fn gcd(mut a: u64, mut b: u64) -> u64 {
    while b != 0 {
        (a, b) = (b, a % b);
    }
    a
}

// Extended Euclidean — returns (gcd, x, y) where a*x + b*y = gcd
fn extended_gcd(a: i64, b: i64) -> (i64, i64, i64) {
    if b == 0 {
        return (a, 1, 0);
    }
    let (g, x1, y1) = extended_gcd(b, a % b);
    (g, y1, x1 - (a / b) * y1)
}

fn main() {
    println!("{}", gcd(48, 18));   // 6
    println!("{}", gcd(100, 75));  // 25
    let (g, x, y) = extended_gcd(35, 15);
    println!("gcd={g}, x={x}, y={y}"); // gcd=5, x=1, y=-2
}`,
  },
};
