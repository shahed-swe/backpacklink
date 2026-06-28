import 'package:flutter/material.dart';

/// Centered "please sign in" prompt for auth-gated tabs.
class AuthPrompt extends StatelessWidget {
  final String emoji;
  final String message;
  final VoidCallback onSignIn;
  const AuthPrompt({this.emoji = '🎒', required this.message, required this.onSignIn, super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(emoji, style: const TextStyle(fontSize: 44)),
        const SizedBox(height: 12),
        Text(message),
        const SizedBox(height: 16),
        FilledButton(onPressed: onSignIn, child: const Text('Sign in')),
      ]),
    );
  }
}
