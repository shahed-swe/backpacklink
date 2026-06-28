import 'package:flutter/material.dart';

/// Centered loading spinner.
class LoadingView extends StatelessWidget {
  const LoadingView({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: CircularProgressIndicator());
}

/// Error message with a retry button.
class ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const ErrorRetry(this.message, this.onRetry, {super.key});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
      ]),
    );
  }
}

/// FutureBuilder wrapper with consistent loading / error / data handling.
/// Replaces the repeated `if (waiting) ... if (error) ...` blocks in screens.
class AsyncView<T> extends StatelessWidget {
  final Future<T>? future;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;
  final String errorMessage;
  const AsyncView({
    required this.future,
    required this.builder,
    this.onRetry,
    this.errorMessage = 'Something went wrong. Please try again.',
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return const LoadingView();
        if (snap.hasError || !snap.hasData) {
          return ErrorRetry(errorMessage, onRetry ?? () {});
        }
        return builder(snap.data as T);
      },
    );
  }
}
