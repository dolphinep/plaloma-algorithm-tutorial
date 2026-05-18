import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface SieveState {
  limit: number;
  isPrime: boolean[];
  currentPrime: number | null;
  currentMultiple: number | null;
  primes: number[];
}

type SieveInput = { limit: number };

function generateSteps(input: SieveInput): AlgorithmStep<SieveState>[] {
  const { limit } = input;
  const steps: AlgorithmStep<SieveState>[] = [];

  const isPrime = Array(limit + 1).fill(true);
  isPrime[0] = false;
  if (limit >= 1) isPrime[1] = false;
  const primes: number[] = [];

  // Initial step
  steps.push({
    description: `Initialize: mark 0 and 1 as not prime. All others assumed prime.`,
    state: {
      limit,
      isPrime: [...isPrime],
      currentPrime: null,
      currentMultiple: null,
      primes: [],
    },
    highlights: { element_0: "visited", element_1: "visited" },
    variables: { limit, initializedSize: limit + 1 },
  });

  // Sieve
  for (let p = 2; p * p <= limit; p++) {
    if (!isPrime[p]) continue;

    // Announce new prime
    steps.push({
      description: `Found prime ${p}. Eliminating its multiples starting from ${p}×${p}=${p * p}.`,
      state: {
        limit,
        isPrime: [...isPrime],
        currentPrime: p,
        currentMultiple: null,
        primes: [...primes],
      },
      highlights: { [`element_${p}`]: "active" },
      variables: { prime: p, firstMultiple: p * p },
    });

    // Eliminate multiples
    for (let m = p * p; m <= limit; m += p) {
      isPrime[m] = false;
      steps.push({
        description: `Mark ${m} = ${p}×${m / p} as composite.`,
        state: {
          limit,
          isPrime: [...isPrime],
          currentPrime: p,
          currentMultiple: m,
          primes: [...primes],
        },
        highlights: {
          [`element_${p}`]: "compare",
          [`element_${m}`]: "visited",
        },
        variables: { prime: p, multiple: m, factor: m / p },
      });
    }
  }

  // Collect all primes
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) primes.push(i);
  }

  // Final step
  steps.push({
    description: `Found ${primes.length} primes up to ${limit}: ${primes.join(", ")}.`,
    state: {
      limit,
      isPrime: [...isPrime],
      currentPrime: null,
      currentMultiple: null,
      primes: [...primes],
    },
    highlights: Object.fromEntries(
      primes.map((p) => [`element_${p}`, "found" as const])
    ),
    variables: { count: primes.length, primes: primes.join(", ") },
  });

  return steps;
}

export const sieveOfEratosthenes: AlgorithmDefinition<SieveInput, SieveState> =
  {
    slug: "sieve",
    name: "Sieve of Eratosthenes",
    category: "math",
    difficulty: "beginner",
    tags: ["prime", "sieve", "number-theory", "bitarray"],
    summary:
      "Find all primes up to a limit by iteratively eliminating multiples of each discovered prime.",

    description: `The Sieve of Eratosthenes, described by the Greek mathematician Eratosthenes around 240 BC, is one of the oldest known algorithms still used in production software today. It operates on a boolean array of size n+1 and works by an elegantly simple insight: starting from the smallest prime (2), mark all of its multiples as composite; advance to the next unmarked number (which must be prime) and repeat. Crucially, multiples of p need only start from p², because any smaller multiple p×k (k < p) was already eliminated when we processed k.

The outer loop needs only run while p² ≤ n, giving the algorithm its O(n log log n) time complexity — a consequence of the harmonic series summed over prime reciprocals. The space requirement is O(n) for the boolean array, which in practice can be compressed to a bitset (1 bit per number) so that a sieve up to 10⁸ fits in just 12 MB of RAM. Further optimizations like the segmented sieve allow computing primes in ranges far beyond available memory by processing the number line in cache-sized chunks.

The sieve's combination of extreme simplicity, provable correctness, and near-linear performance has kept it relevant for over two millennia. Modern applications include precomputing prime tables for competitive programming, generating large primes for cryptographic key material, and factorization by trial division using the precomputed prime list.`,

    realWorldUsage: [
      {
        system: "Cryptographic libraries (OpenSSL, BoringSSL)",
        useCase: "Candidate prime sieving during RSA key generation",
        why: "RSA requires two large prime numbers. Generating them involves sieving candidate integers against small primes (up to ~2000) to quickly reject composites before running the expensive Miller-Rabin primality test. Sieving eliminates ~70% of candidates with negligible CPU cost.",
      },
      {
        system: "Competitive programming judges (Codeforces, LeetCode)",
        useCase: "Precomputed prime tables for number-theory problems",
        why: "Problems involving prime factorization, Euler's totient, or Möbius function are solved in O(1) per query after a one-time O(n log log n) sieve. Contestants run the sieve at program startup to build a primes list and smallest-prime-factor table reused across all test cases.",
      },
      {
        system: "Embedded systems / firmware",
        useCase: "Prime tables for CRC polynomial selection",
        why: "CRC error-detection codes require primitive polynomials over GF(2), whose degrees are tied to prime exponents. Embedded toolchains use a sieve to generate the relevant prime table at compile time, storing only the bitset in read-only flash memory to minimize footprint.",
      },
    ],

    complexity: {
      time: {
        best: "O(n log log n)",
        average: "O(n log log n)",
        worst: "O(n log log n)",
      },
      space: "O(n)",
    },

    related: ["gcd-euclidean"],
    implemented: true,
    defaultInput: { limit: 30 },
    generateSteps,

    code: {
      typescript: `function sieveOfEratosthenes(limit: number): number[] {
  const isPrime = new Uint8Array(limit + 1).fill(1);
  isPrime[0] = 0;
  if (limit >= 1) isPrime[1] = 0;

  for (let p = 2; p * p <= limit; p++) {
    if (isPrime[p]) {
      for (let m = p * p; m <= limit; m += p) {
        isPrime[m] = 0;
      }
    }
  }

  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) primes.push(i);
  }
  return primes;
}

// Usage
console.log(sieveOfEratosthenes(30));
// [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]`,

      go: `package main

import "fmt"

func sieveOfEratosthenes(limit int) []int {
	isPrime := make([]bool, limit+1)
	for i := 2; i <= limit; i++ {
		isPrime[i] = true
	}

	for p := 2; p*p <= limit; p++ {
		if isPrime[p] {
			for m := p * p; m <= limit; m += p {
				isPrime[m] = false
			}
		}
	}

	primes := []int{}
	for i := 2; i <= limit; i++ {
		if isPrime[i] {
			primes = append(primes, i)
		}
	}
	return primes
}

func main() {
	fmt.Println(sieveOfEratosthenes(30))
	// [2 3 5 7 11 13 17 19 23 29]
}`,

      rust: `fn sieve_of_eratosthenes(limit: usize) -> Vec<usize> {
    let mut is_prime = vec![true; limit + 1];
    if limit >= 1 {
        is_prime[0] = false;
        is_prime[1] = false;
    }

    let mut p = 2;
    while p * p <= limit {
        if is_prime[p] {
            let mut m = p * p;
            while m <= limit {
                is_prime[m] = false;
                m += p;
            }
        }
        p += 1;
    }

    (2..=limit).filter(|&i| is_prime[i]).collect()
}

fn main() {
    println!("{:?}", sieve_of_eratosthenes(30));
    // [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
}`,
    },
  };
