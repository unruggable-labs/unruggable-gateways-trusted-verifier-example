# TrustedVerifier example

This example demonstrates usage of a `TrustedVerifier` for quickly iterating on a smart contract using the builder syntax exposed by the [Unruggable Gateways](https://github.com/unruggable-labs/unruggable-gateways) solution.

A `TrustedVerifier` verifies that data returned from a trusted gateway has been signed with the expected private key.

Production use cases of Unruggable Gateways will likely utilise our chain specific gateways/[verifiers](https://gateway-docs.unruggable.com/verifier-deployments) that return/verify proofs of data stored on the respective L2 blockchain.

The unlock of the `TrustedVerifier` is that it allows you to **instantaneously** verify data by relaxing trust assumptions slightly to trust a known secure signer.

To run this example simple checkout the repo, install the dependencies, and run the example.

```
git clone https://github.com/unruggable-labs/unruggable-gateways-trusted-verifier-example.git
bun i
bun test test/trusted-verifier.test.ts
```

For more guidance check out our [documentation](https://gateway-docs.unruggable.com/).