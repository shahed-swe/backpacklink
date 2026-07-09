import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'login_screen.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});
  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  Future<List<Tip>>? _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AppState>().community.tips();
  }

  void _reload() => setState(() => _future = context.read<AppState>().community.tips());

  Future<void> _like(Tip t) async {
    await context.read<AppState>().community.like(t.id);
    _reload();
  }

  /// Reporting and blocking need an account, so send signed-out users to login.
  bool _requireLogin() {
    final state = context.read<AppState>();
    if (state.isLoggedIn) return true;
    Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    return false;
  }

  Future<void> _report(Tip t) async {
    if (!_requireLogin()) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Report this tip?'),
        content: const Text(
          'Tell us this post is offensive, misleading or spam. Our moderators '
          'review reports within 24 hours, and a tip reported by several '
          'travellers is hidden straight away.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: BpColors.coral),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Report'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    try {
      await context.read<AppState>().community.report(t.id);
      messenger.showSnackBar(
        const SnackBar(content: Text('Thanks — our moderators will review this tip.')),
      );
      _reload();
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _block(Tip t) async {
    if (!_requireLogin()) return;
    final who = t.authorName ?? 'this traveller';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Block $who?'),
        content: Text("You won't see any tips from $who again."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: BpColors.coral),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Block'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    try {
      await context.read<AppState>().community.blockUser(t.authorId!);
      messenger.showSnackBar(SnackBar(content: Text('$who is blocked.')));
      _reload();
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _openComposer() {
    final state = context.read<AppState>();
    if (!state.isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _Composer(onPosted: _reload),
    );
  }

  @override
  Widget build(BuildContext context) {
    final myId = context.watch<AppState>().user?.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Community tips')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openComposer,
        backgroundColor: BpColors.coral,
        icon: const Icon(Icons.edit, color: Colors.white),
        label: const Text('Share a tip', style: TextStyle(color: Colors.white)),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<List<Tip>>(
          future: _future,
          onRetry: _reload,
          builder: (tips) {
            if (tips.isEmpty) {
              return ListView(children: const [
                SizedBox(height: 120),
                Center(child: Text('🌍', style: TextStyle(fontSize: 40))),
                SizedBox(height: 12),
                Center(child: Text('No tips yet — be the first to share!')),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
              itemCount: tips.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final t = tips[i];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        BpChip.brand(t.country),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            t.authorName ?? 'A traveler',
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 12, color: BpColors.inkFade(0.4)),
                          ),
                        ),
                        PopupMenuButton<String>(
                          tooltip: 'More',
                          padding: EdgeInsets.zero,
                          icon: Icon(Icons.more_horiz, size: 20, color: BpColors.inkFade(0.4)),
                          onSelected: (v) {
                            if (v == 'report') _report(t);
                            if (v == 'block') _block(t);
                          },
                          itemBuilder: (_) => [
                            const PopupMenuItem(value: 'report', child: Text('Report post')),
                            // You can't block yourself, and we need an author id to do it.
                            if (t.authorId != null && t.authorId != myId)
                              const PopupMenuItem(value: 'block', child: Text('Block traveller')),
                          ],
                        ),
                      ]),
                      const SizedBox(height: 8),
                      Text(t.body),
                      const SizedBox(height: 8),
                      InkWell(
                        onTap: () => _like(t),
                        child: Text('❤ ${t.likes}', style: const TextStyle(color: BpColors.coral, fontWeight: FontWeight.w700)),
                      ),
                    ]),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _Composer extends StatefulWidget {
  final VoidCallback onPosted;
  const _Composer({required this.onPosted});
  @override
  State<_Composer> createState() => _ComposerState();
}

class _ComposerState extends State<_Composer> {
  final _country = TextEditingController();
  final _body = TextEditingController();
  bool _busy = false;

  Future<void> _submit() async {
    if (_country.text.trim().isEmpty || _body.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      await context.read<AppState>().community.post(_country.text.trim(), _body.text.trim());
      if (mounted) {
        Navigator.pop(context);
        widget.onPosted();
      }
    } catch (_) {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _country.dispose();
    _body.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Share a tip', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        TextField(controller: _country, decoration: const InputDecoration(labelText: 'Country (e.g. Japan)')),
        const SizedBox(height: 10),
        TextField(controller: _body, maxLines: 3, decoration: const InputDecoration(labelText: 'How did it go?')),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton(onPressed: _busy ? null : _submit, child: Text(_busy ? 'Posting…' : 'Post')),
        ),
      ]),
    );
  }
}
