import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import 'esim_detail_screen.dart';
import 'order_status_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final Package pkg;
  const CheckoutScreen({required this.pkg, super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _busy = false;
  String? _error;

  final _couponController = TextEditingController();
  CouponResult? _coupon;
  bool _applyingCoupon = false;

  bool get _discounted => _coupon?.valid == true;
  double get _price => _discounted ? _coupon!.finalPrice : widget.pkg.retail;

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _applyingCoupon = true;
      _error = null;
    });
    try {
      final account = context.read<AppState>().account;
      final result = await account.validateCoupon(code, widget.pkg.id);
      setState(() {
        _coupon = result;
        _applyingCoupon = false;
      });
    } catch (e) {
      setState(() {
        _coupon = CouponResult(valid: false, reason: '$e', discountAmount: 0, finalPrice: widget.pkg.retail);
        _applyingCoupon = false;
      });
    }
  }

  Future<void> _pay() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final account = context.read<AppState>().account;
    try {
      final result = await account.checkout(
        widget.pkg.id,
        couponCode: _discounted ? _couponController.text.trim() : null,
      );
      if (result.checkoutUrl != null) {
        // Stripe: open hosted checkout, then track the order on return.
        await launchUrl(Uri.parse(result.checkoutUrl!), mode: LaunchMode.externalApplication);
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => OrderStatusScreen(orderId: result.orderId)),
          );
        }
        return;
      }
      final order = await account.orderStatus(result.orderId);
      if (!mounted) return;
      if (order.status == 'completed' && order.esimId != null) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => EsimDetailScreen(esimId: order.esimId!, justPurchased: true)),
        );
      } else {
        setState(() {
          _busy = false;
          _error = order.failureReason ?? 'Order could not be completed.';
        });
      }
    } catch (e) {
      setState(() {
        _busy = false;
        _error = '$e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pkg = widget.pkg;
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(pkg.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${pkg.dataLabel} · ${pkg.validityLabel}',
                          style: TextStyle(color: BpColors.inkFade(0.5))),
                    ]),
                  ),
                  Text(money(pkg.retail, pkg.currency),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        decoration: _discounted ? TextDecoration.lineThrough : null,
                        color: _discounted ? BpColors.inkFade(0.4) : null,
                      )),
                ]),
              ),
            ),
            const SizedBox(height: 12),
            // Coupon
            if (_discounted)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(color: BpColors.brandBg, borderRadius: BorderRadius.circular(14)),
                child: Row(children: [
                  Expanded(
                    child: Text('Coupon applied — save ${money(_coupon!.discountAmount, pkg.currency)}',
                        style: const TextStyle(color: BpColors.brand, fontWeight: FontWeight.w700)),
                  ),
                  TextButton(
                    onPressed: () => setState(() {
                      _coupon = null;
                      _couponController.clear();
                    }),
                    child: const Text('Remove'),
                  ),
                ]),
              )
            else
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _couponController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(hintText: 'Coupon code'),
                    onSubmitted: (_) => _applyCoupon(),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: _applyingCoupon ? null : _applyCoupon,
                  child: _applyingCoupon
                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Apply'),
                ),
              ]),
            if (_coupon != null && !_coupon!.valid && _coupon!.reason != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(_coupon!.reason!, style: const TextStyle(color: BpColors.coral, fontSize: 13)),
                ),
              ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(_error!, style: const TextStyle(color: BpColors.coral)),
              ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _busy ? null : _pay,
                child: _busy
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Pay ${money(_price, pkg.currency)}'),
              ),
            ),
            const SizedBox(height: 8),
            Text('Secure card payment · instant eSIM delivery',
                style: TextStyle(fontSize: 12, color: BpColors.inkFade(0.4))),
          ],
        ),
      ),
    );
  }
}
