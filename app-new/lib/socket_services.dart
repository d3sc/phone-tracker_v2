import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:android_id/android_id.dart';

class SocketServices {
  static const _androidIdPlugin = AndroidId();
  static final SocketServices _instance = SocketServices._internal();
  late IO.Socket socket;
  bool _isConnected = false;

  Function(dynamic data)? getLocationEvent;
  Function(dynamic data)? statusConnection;

  factory SocketServices() {
    return _instance;
  }

  SocketServices._internal() {
    socket = IO.io(
      "http://192.168.21.29:3000",
      IO.OptionBuilder().setTransports(["websocket"]).setExtraHeaders(
              {"reconnect": "true"}) // ✅ Tambahkan extra header
          .build(),
    );

    _setupListeners();
  }

  void _setupListeners() async {
    String androidId;
    try {
      androidId = await _androidIdPlugin.getId() ?? 'Unknown ID';
    } on Exception catch (e) {
      androidId = 'Failed to get Android ID: $e';
    }
    socket.onConnect((_) {
      print("✅ Connected to socket");
      _isConnected = true;

      joinSession(androidId);
    });

    socket.onDisconnect((_) {
      print("❌ Disconnected from socket");
      _isConnected = false;
      _attemptReconnect(); // ✅ Panggil reconnect jika terputus
    });

    socket.on("get-location", (data) => getLocationEvent?.call(data));
    socket.on("session-join", (data) => statusConnection?.call(data));
  }

  void _attemptReconnect() {
    if (!_isConnected) {
      print("🔄 Trying to reconnect...");
      Future.delayed(Duration(seconds: 3), () {
        if (!_isConnected) {
          socket.connect();
        }
      });
    }
  }

  void connect() {
    if (!_isConnected) {
      socket.connect();
    }
  }

  void joinSession(String userId) {
    if (_isConnected) {
      socket.emit("user-join", userId);
    }
  }

  void dispose() {
    if (_isConnected) {
      socket.disconnect();
      _isConnected = false;
    }
  }
}
