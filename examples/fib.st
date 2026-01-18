Global makeSlot: "Math" with: (Object clone).
Math setObjectName: "Math".
Math makeSlot: "fib:" with: [n|
    n == 0 ifTrue: [ ^ 0. ].
    n == 1 ifTrue: [ ^ 1. ].
    (Math fib:  n - 2  ) + (Math fib: n - 1 ).
].
Math fib: 6.
