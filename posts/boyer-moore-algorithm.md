---
title: 'Boyer-Moore Majority Voting Algorithm'
date: '2024-10-13'
---

The Boyer–Moore majority vote algorithm is a streaming algorithm, meaning an algorithm for processing data streams where the input is a sequence of items that can be read in one or possibly a few
passes, published in 1981 by Robert S Boyer and J Strother Moore, two computer scientists. The algorithm is used to find the **majority element** among a data set, so the value that has more than
**N/2** occurences.

The algorithm essentially finds which item is of the majority or more than 50%. But it doesn't seem great if you were to have three candidates for example or if it was an even split. For if you had
three candidates and one had 40%, and the other two had 30%, if you ran a check on the algorithm it would fail the check because none of the candidates have more than **n / 2**. And if it was an even
split which ever was the last candidate would be assigned, so the only way to catch that is **IF** you added the **n / 2** check.

I wonder if we ran the check to be **n / k** where **k** is the amount of different candidate options if that would be a better general vote check (so data = [ 1,2,3,3 ], k = 3). But I digress, this
is just to check the **majority**.

In pseudocode:

-   Initialize an element m and a counter c with c = 0
-   For each element x of the input sequence:
-   -   If c = 0, then assign m = x and c = 1
-   -   else if m = x, then assign c = c + 1
-   -   else assign c = c − 1
-   Return m

I came acrossed this problem in a Leetcode problem fyi.

Here's a graphic from the Wikipedia page that I found handy:

![Image](https://s3.us-west-2.amazonaws.com/reedthazen.me/images/posts/Boyer-Moore_MJRTY.png)

If there's a guarantee that a majority element always exists, we don't need an additional check.

```javascript
function majorityElement(nums: number[]): number {
    let candidate: number | null = null;
    let count = 0;

    for (const num of nums) {
        if (count === 0) {
            candidate = num;
        }
        count += (num === candidate) ? 1 : -1;
    }

    return candidate!;
}
```

But if there is no guarantee it is a good idea to run a check that the candidate appears n / 2 times.

```javascript
function majorityElement(nums: number[]): number | null {
    let candidate: number | null = null;
    let count = 0;

    // First pass: Find the candidate using the Boyer-Moore Voting Algorithm
    for (const num of nums) {
        if (count === 0) {
            candidate = num;
        }
        count += num === candidate ? 1 : -1;
    }

    // Second pass: Verify if the candidate is actually the majority element
    count = 0;
    for (const num of nums) {
        if (num === candidate) {
            count++;
        }
    }

    // Check if the candidate appears more than n / 2 times
    if (count > Math.floor(nums.length / 2)) {
        return candidate;
    } else {
        return null; // No majority element
    }
}
```

references: [1](https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_majority_vote_algorithm), [2](https://www.geeksforgeeks.org/boyer-moore-majority-voting-algorithm/)
