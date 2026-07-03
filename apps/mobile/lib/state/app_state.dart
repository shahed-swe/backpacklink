import 'package:flutter/foundation.dart';
import '../data/api_client.dart';
import '../data/models.dart';
import '../data/services.dart';

/// App session + a thin entry point to the service layer.
/// Screens read data via `state.catalog` / `state.account` and auth via this.
class AppState extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  late final AuthService auth = AuthService(_api);
  late final CatalogService catalog = CatalogService(_api);
  late final AccountService account = AccountService(_api);
  late final SupportService support = SupportService(_api);
  late final CommunityService community = CommunityService(_api);

  AppUser? user;
  bool ready = false;

  bool get isLoggedIn => user != null;
  String? get authToken => _api.token;

  Future<void> init() async {
    _api.onUnauthorized = () {
      _api.setToken(null);
      user = null;
      notifyListeners();
    };
    await _api.loadToken();
    if (_api.hasToken) {
      try {
        user = await auth.me();
      } catch (_) {
        await _api.setToken(null);
      }
    }
    ready = true;
    notifyListeners();
  }

  Future<AppUser> login(String email, String password) async {
    final res = await auth.login(email, password);
    await _api.setToken(res.token);
    user = res.user;
    notifyListeners();
    return res.user;
  }

  Future<AppUser> signup(Map<String, dynamic> data) async {
    final res = await auth.signup(data);
    await _api.setToken(res.token);
    user = res.user;
    notifyListeners();
    return res.user;
  }

  Future<void> logout() async {
    await _api.setToken(null);
    user = null;
    notifyListeners();
  }
}
