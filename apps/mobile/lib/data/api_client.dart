import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config.dart';

/// Low-level HTTP client for the BackpackLink backend.
/// Stores the JWT in shared_preferences and attaches it to requests.
class ApiClient {
  static const _tokenKey = 'bpl_token';
  String? _token;

  /// Called when the backend rejects our token (401) so the app can log out.
  void Function()? onUnauthorized;

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }

  Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove(_tokenKey);
    } else {
      await prefs.setString(_tokenKey, token);
    }
  }

  bool get hasToken => _token != null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<dynamic> get(String path) async {
    final res = await http.get(Uri.parse('${Config.apiUrl}$path'), headers: _headers);
    return _handle(res);
  }

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    final res = await http.post(
      Uri.parse('${Config.apiUrl}$path'),
      headers: _headers,
      body: body == null ? null : jsonEncode(body),
    );
    return _handle(res);
  }

  dynamic _handle(http.Response res) {
    final dynamic json = res.body.isEmpty ? {} : jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return json;
    if (res.statusCode == 401) onUnauthorized?.call();
    final msg = (json is Map && json['error'] != null)
        ? json['error']
        : 'Request failed (${res.statusCode})';
    throw ApiException('$msg');
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}
