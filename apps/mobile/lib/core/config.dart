/// Backend API base URL.
///
/// Android emulator can't reach the host's "localhost" — use 10.0.2.2.
/// iOS simulator and desktop can use localhost. Override at run time with:
///   flutter run --dart-define=API_URL=https://api.yourdomain.com
class Config {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );
}
