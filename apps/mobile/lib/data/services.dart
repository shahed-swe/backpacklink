import 'api_client.dart';
import 'models.dart';

/// Authentication endpoints.
class AuthService {
  final ApiClient _api;
  AuthService(this._api);

  Future<({String token, AppUser user})> login(String email, String password) async {
    final res = await _api.post('/api/auth/login', {'email': email, 'password': password});
    return (token: '${res['token']}', user: AppUser.fromJson(res['user']));
  }

  Future<({String token, AppUser user})> signup(Map<String, dynamic> data) async {
    final res = await _api.post('/api/auth/signup', data);
    return (token: '${res['token']}', user: AppUser.fromJson(res['user']));
  }

  Future<AppUser> me() async {
    final res = await _api.get('/api/auth/me');
    return AppUser.fromJson(res['user']);
  }
}

/// Catalog (browse) endpoints.
class CatalogService {
  final ApiClient _api;
  CatalogService(this._api);

  Future<List<Country>> countries() async {
    final res = await _api.get('/api/catalog/countries');
    return (res['data'] as List).map((e) => Country.fromJson(e)).toList();
  }

  Future<List<Continent>> continents() async {
    final res = await _api.get('/api/catalog/continents');
    return (res['data'] as List).map((e) => Continent.fromJson(e)).toList();
  }

  Future<List<Package>> countryPackages(int id, {String type = 'DATA-ONLY'}) async {
    final res = await _api.get('/api/catalog/countries/$id/packages?type=$type');
    return (res['data'] as List).map((e) => Package.fromJson(e)).toList();
  }

  Future<List<Package>> continentPackages(int id) async {
    final res = await _api.get('/api/catalog/continents/$id/packages?type=DATA-ONLY');
    return (res['data'] as List).map((e) => Package.fromJson(e)).toList();
  }

  Future<List<Package>> globalPackages() async {
    final res = await _api.get('/api/catalog/global?type=DATA-ONLY');
    return (res['data'] as List).map((e) => Package.fromJson(e)).toList();
  }

  Future<Package> packageDetail(String id) async {
    final res = await _api.get('/api/catalog/packages/$id');
    return Package.fromJson(res['data']);
  }

  Future<List<CoverageNet>> countryCoverage(int id) async {
    final res = await _api.get('/api/catalog/coverage/$id');
    return (res['networks'] as List).map((e) => CoverageNet.fromJson(e)).toList();
  }
}

/// Admin-managed campaign content (promo bar + banners) for the home page.
class PromotionsService {
  final ApiClient _api;
  PromotionsService(this._api);

  Future<HomePromotions> home() async {
    final res = await _api.get('/api/promotions?placement=mobile');
    return HomePromotions.fromJson((res['data'] as Map<String, dynamic>?) ?? const {});
  }
}

/// Support chat (history via REST; realtime via socket in the screen).
class SupportService {
  final ApiClient _api;
  SupportService(this._api);

  Future<List<SupportMsg>> history() async {
    final res = await _api.get('/api/support/thread');
    return (res['messages'] as List).map((e) => SupportMsg.fromJson(e)).toList();
  }
}

/// Community tips.
class CommunityService {
  final ApiClient _api;
  CommunityService(this._api);

  Future<List<Tip>> tips() async {
    final res = await _api.get('/api/community/tips');
    return (res['data'] as List).map((e) => Tip.fromJson(e)).toList();
  }

  Future<void> post(String country, String body) async {
    await _api.post('/api/community/tips', {'country': country, 'body': body});
  }

  Future<void> like(String id) async {
    await _api.post('/api/community/tips/$id/like');
  }
}

/// Customer account: eSIMs, usage, orders, checkout.
class AccountService {
  final ApiClient _api;
  AccountService(this._api);

  Future<List<EsimRow>> myEsims() async {
    final res = await _api.get('/api/me/esims');
    return (res['data'] as List).map((e) => EsimRow.fromJson(e)).toList();
  }

  Future<({EsimRow esim, Usage? usage})> esimDetail(String id) async {
    final res = await _api.get('/api/me/esims/$id');
    final data = res['data'];
    return (
      esim: EsimRow.fromJson(data['esim']),
      usage: data['usage'] == null ? null : Usage.fromJson(data['usage']),
    );
  }

  Future<List<OrderRow>> orders() async {
    final res = await _api.get('/api/me/orders');
    return (res['data'] as List).map((e) => OrderRow.fromJson(e)).toList();
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await _api.patch('/api/me/password', {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  /// Permanently deletes the signed-in account and its personal data.
  Future<void> deleteAccount(String password) async {
    await _api.delete('/api/me', {'password': password});
  }

  Future<CheckoutResult> checkout(String packageId, {String? couponCode}) async {
    final res = await _api.post('/api/checkout', {
      'packageId': packageId,
      if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
    });
    final orderId = '${res['orderId']}';
    if (res['mode'] == 'stripe') return CheckoutResult(orderId, res['checkoutUrl']);
    await _api.post('/api/checkout/$orderId/simulate-pay');
    return CheckoutResult(orderId, null);
  }

  /// Preview a coupon discount for a package before paying.
  Future<CouponResult> validateCoupon(String code, String packageId) async {
    final res = await _api.post('/api/coupons/validate', {'code': code, 'packageId': packageId});
    return CouponResult.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<OrderRow> orderStatus(String orderId) async {
    final res = await _api.get('/api/checkout/$orderId');
    return OrderRow.fromJson(res['order']);
  }

  /// Verify the Stripe payment and fulfill (webhook-free). Idempotent.
  Future<OrderRow> confirm(String orderId) async {
    final res = await _api.post('/api/checkout/$orderId/confirm');
    return OrderRow.fromJson(res['order']);
  }
}
