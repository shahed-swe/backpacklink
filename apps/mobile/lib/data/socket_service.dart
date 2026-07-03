import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/config.dart';

/// Thin wrapper over a JWT-authenticated socket.io connection (support chat).
class SupportSocket {
  io.Socket? _socket;

  io.Socket connect(String token) {
    _socket ??= io.io(
      Config.apiUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );
    if (!_socket!.connected) _socket!.connect();
    return _socket!;
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
