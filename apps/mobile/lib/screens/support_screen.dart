import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../data/socket_service.dart';
import '../state/app_state.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});
  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _socket = SupportSocket();
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  final List<SupportMsg> _messages = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final state = context.read<AppState>();
    try {
      final history = await state.support.history();
      if (mounted) setState(() => _messages.addAll(history));
    } catch (_) {}
    if (mounted) setState(() => _loading = false);

    final token = state.authToken;
    if (token != null) {
      final s = _socket.connect(token);
      s.on('support:message', (data) {
        final m = SupportMsg.fromJson(Map<String, dynamic>.from(data as Map));
        if (!mounted) return;
        if (_messages.any((x) => x.id == m.id)) return;
        setState(() => _messages.add(m));
        _jump();
      });
    }
    _jump();
  }

  void _jump() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    });
  }

  void _send() {
    final body = _controller.text.trim();
    if (body.isEmpty) return;
    _socket.connect(context.read<AppState>().authToken ?? '').emit('support:send', {'body': body});
    _controller.clear();
  }

  @override
  void dispose() {
    _socket.dispose();
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(mainAxisSize: MainAxisSize.min, children: [
                            const Text('👋', style: TextStyle(fontSize: 44)),
                            const SizedBox(height: 12),
                            Text('Ask us anything — a real human replies fast.',
                                textAlign: TextAlign.center, style: TextStyle(color: BpColors.inkFade(0.6))),
                          ]),
                        ),
                      )
                    : ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final m = _messages[i];
                          final mine = m.senderRole == 'customer';
                          return Align(
                            alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                              decoration: BoxDecoration(
                                color: mine ? BpColors.coral : BpColors.sand100,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(m.body, style: TextStyle(color: mine ? Colors.white : BpColors.ink)),
                            ),
                          );
                        },
                      ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(hintText: 'Type your message…'),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: _send, child: const Text('Send')),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
