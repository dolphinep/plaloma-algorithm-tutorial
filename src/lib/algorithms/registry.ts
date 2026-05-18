import type { AlgorithmMeta, AlgorithmCategory, Difficulty } from "@/types/algorithm";

// Full algorithm list — only implemented ones have a dynamic import loader
export const algorithmRegistry: AlgorithmMeta[] = [
  // ── Searching ─────────────────────────────────────────────────────────────
  {
    slug: "binary-search",
    name: "Binary Search",
    category: "searching",
    difficulty: "beginner",
    tags: ["divide-and-conquer", "sorted", "logarithmic"],
    summary: "Find an element in a sorted array by halving the search space each step.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(1)", average: "O(log n)", worst: "O(log n)" }, space: "O(1)", inPlace: true },
    related: ["linear-search", "jump-search"],
    implemented: true,
  },
  {
    slug: "linear-search",
    name: "Linear Search",
    category: "searching",
    difficulty: "beginner",
    tags: ["brute-force"],
    summary: "Scan every element until the target is found.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(1)", average: "O(n)", worst: "O(n)" }, space: "O(1)", inPlace: true },
    related: ["binary-search"],
    implemented: true,
  },
  {
    slug: "jump-search",
    name: "Jump Search",
    category: "searching",
    difficulty: "intermediate",
    tags: ["sorted", "block"],
    summary: "Jump ahead by √n steps then do linear search within the block.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(1)", average: "O(√n)", worst: "O(√n)" }, space: "O(1)", inPlace: true },
    related: ["binary-search", "linear-search"],
    implemented: true,
  },

  // ── Sorting ───────────────────────────────────────────────────────────────
  {
    slug: "bubble-sort",
    name: "Bubble Sort",
    category: "sorting",
    difficulty: "beginner",
    tags: ["comparison", "stable", "in-place"],
    summary: "Repeatedly swap adjacent elements that are out of order.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" }, space: "O(1)", stable: true, inPlace: true },
    related: ["selection-sort", "insertion-sort"],
    implemented: true,
  },
  {
    slug: "selection-sort",
    name: "Selection Sort",
    category: "sorting",
    difficulty: "beginner",
    tags: ["comparison", "in-place"],
    summary: "Find the minimum element and place it at the front, repeat.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" }, space: "O(1)", stable: false, inPlace: true },
    related: ["bubble-sort", "insertion-sort"],
    implemented: true,
  },
  {
    slug: "insertion-sort",
    name: "Insertion Sort",
    category: "sorting",
    difficulty: "beginner",
    tags: ["comparison", "stable", "in-place", "online"],
    summary: "Build a sorted array one element at a time by inserting into position.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" }, space: "O(1)", stable: true, inPlace: true, online: true },
    related: ["bubble-sort", "merge-sort"],
    implemented: true,
  },
  {
    slug: "merge-sort",
    name: "Merge Sort",
    category: "sorting",
    difficulty: "intermediate",
    tags: ["divide-and-conquer", "stable", "comparison"],
    summary: "Divide in half, sort each half recursively, merge back.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" }, space: "O(n)", stable: true, inPlace: false },
    related: ["quick-sort", "heap-sort"],
    implemented: true,
  },
  {
    slug: "quick-sort",
    name: "Quick Sort",
    category: "sorting",
    difficulty: "intermediate",
    tags: ["divide-and-conquer", "in-place", "comparison"],
    summary: "Pick a pivot, partition around it, recursively sort partitions.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)" }, space: "O(log n)", stable: false, inPlace: true },
    related: ["merge-sort", "heap-sort"],
    implemented: true,
  },
  {
    slug: "heap-sort",
    name: "Heap Sort",
    category: "sorting",
    difficulty: "intermediate",
    tags: ["comparison", "in-place", "heap"],
    summary: "Build a max-heap, then extract elements one by one.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" }, space: "O(1)", stable: false, inPlace: true },
    related: ["quick-sort", "merge-sort"],
    implemented: true,
  },
  {
    slug: "radix-sort",
    name: "Radix Sort",
    category: "sorting",
    difficulty: "intermediate",
    tags: ["non-comparison", "stable", "integer"],
    summary: "Sort integers digit by digit from least to most significant.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(nk)", average: "O(nk)", worst: "O(nk)" }, space: "O(n+k)", stable: true, inPlace: false },
    related: ["counting-sort", "bucket-sort"],
    implemented: true,
  },
  {
    slug: "counting-sort",
    name: "Counting Sort",
    category: "sorting",
    difficulty: "intermediate",
    tags: ["non-comparison", "stable", "integer"],
    summary: "Count occurrences of each value, then reconstruct sorted output.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n+k)", average: "O(n+k)", worst: "O(n+k)" }, space: "O(k)", stable: true, inPlace: false },
    related: ["radix-sort", "bucket-sort"],
    implemented: true,
  },

  // ── Graph ─────────────────────────────────────────────────────────────────
  {
    slug: "bfs",
    name: "Breadth-First Search",
    category: "graph",
    difficulty: "beginner",
    tags: ["graph", "traversal", "shortest-path", "queue"],
    summary: "Explore all neighbors at the current depth before going deeper.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" }, space: "O(V)" },
    related: ["dfs", "dijkstra"],
    implemented: true,
  },
  {
    slug: "dfs",
    name: "Depth-First Search",
    category: "graph",
    difficulty: "beginner",
    tags: ["graph", "traversal", "stack", "recursive"],
    summary: "Explore as deep as possible before backtracking.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" }, space: "O(V)" },
    related: ["bfs", "topological-sort"],
    implemented: true,
  },
  {
    slug: "dijkstra",
    name: "Dijkstra's Algorithm",
    category: "graph",
    difficulty: "intermediate",
    tags: ["graph", "shortest-path", "greedy", "weighted"],
    summary: "Find shortest paths from a source node using a priority queue.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O((V+E) log V)", average: "O((V+E) log V)", worst: "O((V+E) log V)" }, space: "O(V)" },
    related: ["bfs", "a-star", "bellman-ford"],
    implemented: true,
  },
  {
    slug: "a-star",
    name: "A* Search",
    category: "graph",
    difficulty: "advanced",
    tags: ["graph", "shortest-path", "heuristic", "informed"],
    summary: "Dijkstra + a heuristic to guide search toward the goal.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(E)", average: "O(b^d)", worst: "O(b^d)" }, space: "O(b^d)" },
    related: ["dijkstra", "bfs"],
    implemented: true,
  },
  {
    slug: "bellman-ford",
    name: "Bellman-Ford",
    category: "graph",
    difficulty: "intermediate",
    tags: ["graph", "shortest-path", "negative-weights"],
    summary: "Single-source shortest paths that handles negative edge weights.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(VE)", average: "O(VE)", worst: "O(VE)" }, space: "O(V)" },
    related: ["dijkstra", "floyd-warshall"],
    implemented: true,
  },
  {
    slug: "floyd-warshall",
    name: "Floyd-Warshall",
    category: "graph",
    difficulty: "intermediate",
    tags: ["graph", "all-pairs-shortest-path", "dynamic-programming"],
    summary: "Find shortest paths between all pairs of nodes.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(V³)", average: "O(V³)", worst: "O(V³)" }, space: "O(V²)" },
    related: ["bellman-ford", "dijkstra"],
    implemented: true,
  },
  {
    slug: "kruskal",
    name: "Kruskal's Algorithm",
    category: "graph",
    difficulty: "intermediate",
    tags: ["graph", "minimum-spanning-tree", "greedy", "union-find"],
    summary: "Build MST by greedily adding cheapest edges that don't form cycles.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(E log E)", average: "O(E log E)", worst: "O(E log E)" }, space: "O(V)" },
    related: ["prim", "union-find"],
    implemented: true,
  },
  {
    slug: "topological-sort",
    name: "Topological Sort",
    category: "graph",
    difficulty: "intermediate",
    tags: ["graph", "dag", "ordering"],
    summary: "Linear ordering of vertices in a directed acyclic graph.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" }, space: "O(V)" },
    related: ["dfs", "kahn-algorithm"],
    implemented: true,
  },

  // ── Tree ──────────────────────────────────────────────────────────────────
  {
    slug: "bst-insert-search",
    name: "BST Insert & Search",
    category: "tree",
    difficulty: "beginner",
    tags: ["binary-search-tree", "recursive"],
    summary: "Insert and search nodes in a Binary Search Tree.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(log n)", average: "O(log n)", worst: "O(n)" }, space: "O(h)" },
    related: ["avl-tree", "red-black-tree"],
    implemented: true,
  },
  {
    slug: "avl-tree",
    name: "AVL Tree",
    category: "tree",
    difficulty: "advanced",
    tags: ["self-balancing", "bst", "rotations"],
    summary: "Self-balancing BST that keeps height difference ≤ 1 via rotations.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(log n)", average: "O(log n)", worst: "O(log n)" }, space: "O(n)" },
    related: ["bst-insert-search", "red-black-tree"],
    implemented: false,
  },

  // ── Dynamic Programming ───────────────────────────────────────────────────
  {
    slug: "fibonacci-dp",
    name: "Fibonacci (DP)",
    category: "dynamic-programming",
    difficulty: "beginner",
    tags: ["memoization", "bottom-up", "overlapping-subproblems"],
    summary: "Compute Fibonacci numbers efficiently using memoization or tabulation.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n)", worst: "O(n)" }, space: "O(n)" },
    related: ["knapsack", "lcs"],
    implemented: true,
  },
  {
    slug: "knapsack",
    name: "0/1 Knapsack",
    category: "dynamic-programming",
    difficulty: "intermediate",
    tags: ["optimization", "subset", "tabulation"],
    summary: "Maximize value of items in a knapsack with weight limit.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(nW)", average: "O(nW)", worst: "O(nW)" }, space: "O(nW)" },
    related: ["fibonacci-dp", "coin-change"],
    implemented: true,
  },
  {
    slug: "lcs",
    name: "Longest Common Subsequence",
    category: "dynamic-programming",
    difficulty: "intermediate",
    tags: ["string", "tabulation"],
    summary: "Find the longest subsequence present in both sequences.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(mn)", average: "O(mn)", worst: "O(mn)" }, space: "O(mn)" },
    related: ["knapsack", "edit-distance"],
    implemented: true,
  },
  {
    slug: "coin-change",
    name: "Coin Change",
    category: "dynamic-programming",
    difficulty: "intermediate",
    tags: ["optimization", "unbounded-knapsack"],
    summary: "Find minimum coins needed to make a target amount.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n·amount)", average: "O(n·amount)", worst: "O(n·amount)" }, space: "O(amount)" },
    related: ["knapsack", "fibonacci-dp"],
    implemented: true,
  },

  // ── Greedy ────────────────────────────────────────────────────────────────
  {
    slug: "huffman-coding",
    name: "Huffman Coding",
    category: "greedy",
    difficulty: "intermediate",
    tags: ["compression", "greedy", "tree"],
    summary: "Lossless compression by assigning shorter codes to frequent characters.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" }, space: "O(n)" },
    related: ["greedy-activity-selection"],
    implemented: true,
  },

  // ── String ────────────────────────────────────────────────────────────────
  {
    slug: "kmp",
    name: "KMP String Search",
    category: "string",
    difficulty: "advanced",
    tags: ["pattern-matching", "linear"],
    summary: "Find pattern in text in O(n+m) using a failure function.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n+m)", average: "O(n+m)", worst: "O(n+m)" }, space: "O(m)" },
    related: ["rabin-karp", "z-algorithm"],
    implemented: true,
  },

  // ── Math ──────────────────────────────────────────────────────────────────
  {
    slug: "sieve-of-eratosthenes",
    name: "Sieve of Eratosthenes",
    category: "math",
    difficulty: "beginner",
    tags: ["prime", "sieve"],
    summary: "Find all primes up to N by eliminating multiples.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n log log n)", average: "O(n log log n)", worst: "O(n log log n)" }, space: "O(n)" },
    related: ["gcd-euclidean"],
    implemented: true,
  },
  {
    slug: "gcd-euclidean",
    name: "Euclidean GCD",
    category: "math",
    difficulty: "beginner",
    tags: ["number-theory", "recursive"],
    summary: "Compute greatest common divisor using repeated division.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(log min(a,b))", average: "O(log min(a,b))", worst: "O(log min(a,b))" }, space: "O(1)" },
    related: ["sieve-of-eratosthenes"],
    implemented: true,
  },

  // ── Data Structures ───────────────────────────────────────────────────────
  {
    slug: "hash-table",
    name: "Hash Table",
    category: "data-structure",
    difficulty: "intermediate",
    tags: ["hashing", "collision", "open-addressing", "chaining"],
    summary: "Key-value store with O(1) average lookup using a hash function.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(1)", average: "O(1)", worst: "O(n)" }, space: "O(n)" },
    related: ["binary-search"],
    implemented: true,
  },
  {
    slug: "bloom-filter",
    name: "Bloom Filter",
    category: "data-structure",
    difficulty: "advanced",
    tags: ["probabilistic", "hashing", "space-efficient"],
    summary: "Space-efficient probabilistic set membership test with false positives.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(k)", average: "O(k)", worst: "O(k)" }, space: "O(m)" },
    related: ["hash-table"],
    implemented: true,
  },

  // ── Sorting (additional) ──────────────────────────────────────────────────
  {
    slug: "shell-sort",
    name: "Shell Sort",
    category: "sorting",
    difficulty: "intermediate",
    tags: ["comparison", "in-place", "gap-sequence"],
    summary: "Generalization of insertion sort that compares elements far apart, then narrows the gap.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n log n)", average: "O(n log² n)", worst: "O(n²)" }, space: "O(1)", stable: false, inPlace: true },
    related: ["insertion-sort", "quick-sort"],
    implemented: true,
  },
  {
    slug: "tim-sort",
    name: "Tim Sort",
    category: "sorting",
    difficulty: "advanced",
    tags: ["hybrid", "stable", "adaptive"],
    summary: "Hybrid of merge sort and insertion sort. Used in Python, Java, and V8.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n log n)", worst: "O(n log n)" }, space: "O(n)", stable: true, inPlace: false },
    related: ["merge-sort", "insertion-sort"],
    implemented: true,
  },
  {
    slug: "bucket-sort",
    name: "Bucket Sort",
    category: "sorting",
    difficulty: "intermediate",
    tags: ["non-comparison", "distribution", "floating-point"],
    summary: "Distribute elements into buckets, sort each bucket, then concatenate.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n+k)", average: "O(n+k)", worst: "O(n²)" }, space: "O(n+k)", stable: true, inPlace: false },
    related: ["counting-sort", "radix-sort"],
    implemented: true,
  },
  {
    slug: "cycle-sort",
    name: "Cycle Sort",
    category: "sorting",
    difficulty: "advanced",
    tags: ["comparison", "in-place", "minimum-writes"],
    summary: "Minimizes the number of writes to memory — optimal for write-expensive media.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" }, space: "O(1)", stable: false, inPlace: true },
    related: ["selection-sort"],
    implemented: true,
  },

  // ── Graph (additional) ────────────────────────────────────────────────────
  {
    slug: "prim-mst",
    name: "Prim's MST",
    category: "graph",
    difficulty: "intermediate",
    tags: ["graph", "minimum-spanning-tree", "greedy", "priority-queue"],
    summary: "Grow a minimum spanning tree by greedily adding the cheapest edge to the frontier.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O((V+E) log V)", average: "O((V+E) log V)", worst: "O((V+E) log V)" }, space: "O(V)" },
    related: ["kruskal", "dijkstra"],
    implemented: true,
  },
  {
    slug: "floyd-cycle-detection",
    name: "Floyd's Cycle Detection",
    category: "graph",
    difficulty: "intermediate",
    tags: ["linked-list", "two-pointers", "tortoise-hare"],
    summary: "Detect cycles in a sequence using two pointers at different speeds.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n)", worst: "O(n)" }, space: "O(1)" },
    related: ["dfs", "union-find"],
    implemented: true,
  },

  // ── Data Structures (additional) ─────────────────────────────────────────
  {
    slug: "union-find",
    name: "Union-Find (Disjoint Set)",
    category: "data-structure",
    difficulty: "intermediate",
    tags: ["disjoint-set", "path-compression", "union-by-rank"],
    summary: "Track which elements belong to the same group with near-O(1) union and find.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(α(n))", average: "O(α(n))", worst: "O(α(n))" }, space: "O(n)" },
    related: ["kruskal", "floyd-cycle-detection"],
    implemented: true,
  },
  {
    slug: "segment-tree",
    name: "Segment Tree",
    category: "data-structure",
    difficulty: "advanced",
    tags: ["range-query", "lazy-propagation", "tree"],
    summary: "Tree for fast range queries (sum, min, max) with O(log n) update.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(log n)", average: "O(log n)", worst: "O(log n)" }, space: "O(n)" },
    related: ["fenwick-tree", "bst-insert-search"],
    implemented: true,
  },
  {
    slug: "fenwick-tree",
    name: "Fenwick Tree (BIT)",
    category: "data-structure",
    difficulty: "advanced",
    tags: ["binary-indexed-tree", "prefix-sum", "range-query"],
    summary: "Compact structure for prefix sum queries and point updates in O(log n).",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(log n)", average: "O(log n)", worst: "O(log n)" }, space: "O(n)" },
    related: ["segment-tree"],
    implemented: true,
  },
  {
    slug: "trie",
    name: "Trie (Prefix Tree)",
    category: "data-structure",
    difficulty: "intermediate",
    tags: ["string", "prefix", "autocomplete"],
    summary: "Tree where each node represents a character. Enables O(m) prefix lookups.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(m)", average: "O(m)", worst: "O(m)" }, space: "O(ALPHABET × n)" },
    related: ["hash-table", "kmp"],
    implemented: true,
  },

  // ── Dynamic Programming (additional) ─────────────────────────────────────
  {
    slug: "edit-distance",
    name: "Edit Distance (Levenshtein)",
    category: "dynamic-programming",
    difficulty: "intermediate",
    tags: ["string", "tabulation", "alignment"],
    summary: "Minimum insertions, deletions, and substitutions to transform one string to another.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(mn)", average: "O(mn)", worst: "O(mn)" }, space: "O(mn)" },
    related: ["lcs", "kmp"],
    implemented: true,
  },
  {
    slug: "lis",
    name: "Longest Increasing Subsequence",
    category: "dynamic-programming",
    difficulty: "intermediate",
    tags: ["subsequence", "patience-sorting", "binary-search"],
    summary: "Find the longest strictly increasing subsequence in O(n log n).",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" }, space: "O(n)" },
    related: ["lcs", "knapsack"],
    implemented: true,
  },
  {
    slug: "kadane",
    name: "Kadane's Algorithm",
    category: "dynamic-programming",
    difficulty: "beginner",
    tags: ["max-subarray", "greedy", "linear"],
    summary: "Find the contiguous subarray with the largest sum in O(n).",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n)", worst: "O(n)" }, space: "O(1)" },
    related: ["fibonacci-dp", "coin-change"],
    implemented: true,
  },
  {
    slug: "matrix-chain",
    name: "Matrix Chain Multiplication",
    category: "dynamic-programming",
    difficulty: "advanced",
    tags: ["optimization", "interval-dp", "parenthesization"],
    summary: "Find the optimal parenthesization of matrix products to minimize operations.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n³)", average: "O(n³)", worst: "O(n³)" }, space: "O(n²)" },
    related: ["knapsack", "lcs"],
    implemented: true,
  },

  // ── String (additional) ───────────────────────────────────────────────────
  {
    slug: "rabin-karp",
    name: "Rabin-Karp",
    category: "string",
    difficulty: "intermediate",
    tags: ["pattern-matching", "rolling-hash", "hashing"],
    summary: "Use a rolling hash to find pattern in text in expected O(n+m).",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n+m)", average: "O(n+m)", worst: "O(nm)" }, space: "O(1)" },
    related: ["kmp", "z-algorithm"],
    implemented: true,
  },
  {
    slug: "z-algorithm",
    name: "Z-Algorithm",
    category: "string",
    difficulty: "intermediate",
    tags: ["pattern-matching", "z-array", "linear"],
    summary: "Build a Z-array to find all pattern occurrences in O(n+m).",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n+m)", average: "O(n+m)", worst: "O(n+m)" }, space: "O(n)" },
    related: ["kmp", "rabin-karp"],
    implemented: true,
  },

  // ── Searching (additional) ────────────────────────────────────────────────
  {
    slug: "two-sum",
    name: "Two Sum",
    category: "searching",
    difficulty: "beginner",
    tags: ["hash-table", "two-pointers", "complement"],
    summary: "Find two numbers in an array that add to a target in O(n).",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n)", worst: "O(n)" }, space: "O(n)" },
    related: ["binary-search", "hash-table"],
    implemented: true,
  },
  {
    slug: "sliding-window-max",
    name: "Sliding Window Maximum",
    category: "searching",
    difficulty: "intermediate",
    tags: ["deque", "sliding-window", "monotonic"],
    summary: "Find the maximum in every window of size k in O(n) using a monotonic deque.",
    description: "",
    realWorldUsage: [],
    complexity: { time: { best: "O(n)", average: "O(n)", worst: "O(n)" }, space: "O(k)" },
    related: ["two-sum"],
    implemented: true,
  },
];

export const CATEGORIES: { value: AlgorithmCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "searching", label: "Searching" },
  { value: "sorting", label: "Sorting" },
  { value: "graph", label: "Graph" },
  { value: "tree", label: "Tree" },
  { value: "dynamic-programming", label: "Dynamic Programming" },
  { value: "greedy", label: "Greedy" },
  { value: "string", label: "String" },
  { value: "math", label: "Math" },
  { value: "data-structure", label: "Data Structure" },
];

export const DIFFICULTIES: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function getAlgorithm(slug: string) {
  return algorithmRegistry.find((a) => a.slug === slug);
}

export async function loadAlgorithmDefinition(slug: string) {
  switch (slug) {
    case "binary-search":
      return (await import("./binary-search")).binarySearch;
    case "bfs":
      return (await import("./bfs")).bfs;
    case "dfs":
      return (await import("./dfs")).dfs;
    case "linear-search":
      return (await import("./linear-search")).linearSearch;
    case "bubble-sort":
      return (await import("./bubble-sort")).bubbleSort;
    case "selection-sort":
      return (await import("./selection-sort")).selectionSort;
    case "insertion-sort":
      return (await import("./insertion-sort")).insertionSort;
    case "merge-sort":
      return (await import("./merge-sort")).mergeSort;
    case "quick-sort":
      return (await import("./quick-sort")).quickSort;
    case "heap-sort":
      return (await import("./heap-sort")).heapSort;
    case "counting-sort":
      return (await import("./counting-sort")).countingSort;
    case "fibonacci-dp":
      return (await import("./fibonacci-dp")).fibonacciDP;
    case "sieve-of-eratosthenes":
      return (await import("./sieve")).sieveOfEratosthenes;
    case "dijkstra":
      return (await import("./dijkstra")).dijkstra;
    case "bellman-ford":
      return (await import("./bellman-ford")).bellmanFord;
    case "prim-mst":
      return (await import("./prim-mst")).primMST;
    case "kadane":
      return (await import("./kadane")).kadane;
    case "coin-change":
      return (await import("./coin-change")).coinChange;
    case "gcd-euclidean":
      return (await import("./gcd-euclidean")).gcdEuclidean;
    case "lcs":
      return (await import("./lcs")).lcs;
    case "knapsack":
      return (await import("./knapsack")).knapsack;
    case "edit-distance":
      return (await import("./edit-distance")).editDistance;
    case "two-sum":
      return (await import("./two-sum")).twoSum;
    case "radix-sort":
      return (await import("./radix-sort")).radixSort;
    case "shell-sort":
      return (await import("./shell-sort")).shellSort;
    case "bucket-sort":
      return (await import("./bucket-sort")).bucketSort;
    case "cycle-sort":
      return (await import("./cycle-sort")).cycleSort;
    case "matrix-chain":
      return (await import("./matrix-chain")).matrixChain;
    case "jump-search":
      return (await import("./jump-search")).jumpSearch;
    case "sliding-window-max":
      return (await import("./sliding-window-max")).slidingWindowMax;
    case "lis":
      return (await import("./lis")).lis;
    case "kmp":
      return (await import("./kmp")).kmp;
    case "rabin-karp":
      return (await import("./rabin-karp")).rabinKarp;
    case "z-algorithm":
      return (await import("./z-algorithm")).zAlgorithm;
    case "topological-sort":
      return (await import("./topological-sort")).topologicalSort;
    case "floyd-cycle-detection":
      return (await import("./floyd-cycle-detection")).floydCycleDetection;
    case "union-find":
      return (await import("./union-find")).unionFind;
    case "hash-table":
      return (await import("./hash-table")).hashTable;
    case "huffman-coding":
      return (await import("./huffman-coding")).huffmanCoding;
    case "a-star":
      return (await import("./a-star")).aStar;
    case "floyd-warshall":
      return (await import("./floyd-warshall")).floydWarshall;
    case "kruskal":
      return (await import("./kruskal")).kruskal;
    case "bst-insert-search":
      return (await import("./bst-insert-search")).bstInsertSearch;
    case "trie":
      return (await import("./trie")).trie;
    case "bloom-filter":
      return (await import("./bloom-filter")).bloomFilter;
    case "fenwick-tree":
      return (await import("./fenwick-tree")).fenwickTree;
    case "segment-tree":
      return (await import("./segment-tree")).segmentTree;
    case "tim-sort":
      return (await import("./tim-sort")).timSort;
    default:
      return null;
  }
}
