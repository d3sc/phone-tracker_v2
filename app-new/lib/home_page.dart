import 'dart:ffi';

import 'package:app/socket_services.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:android_id/android_id.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

@pragma('vm:entry-point')
void startCombinedService() {
  FlutterForegroundTask.setTaskHandler(CombinedTaskHandler());
}

class CombinedTaskHandler extends TaskHandler {
  static const _androidIdPlugin = AndroidId();
  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    var socketService = SocketServices();

    socketService.getLocationEvent = (data) async {
      // setState(() {
      //   socketMessage = data;
      // });

      await _getCurrentLocation();
    };
  }

  @override
  void onRepeatEvent(DateTime timestamp) {}

  @override
  Future<void> onDestroy(DateTime timestamp) async {}

  @override
  void onReceiveData(Object data) {}

  Future<void> _getCurrentLocation() async {
    bool isLocationEnabled = await Geolocator.isLocationServiceEnabled();
    if (!isLocationEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) return;

    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    print("Location: ${position.latitude}, ${position.longitude}");
    _sendLocationToServer(position.latitude, position.longitude);
  }

  Future<void> _sendLocationToServer(double latitude, double longitude) async {
    String androidId;
    try {
      androidId = await _androidIdPlugin.getId() ?? 'Unknown ID';
    } on Exception catch (e) {
      androidId = 'Failed to get Android ID: $e';
    }
    final url = Uri.parse('http://192.168.21.29:3000/location');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(
          {'latitude': latitude, 'longitude': longitude, "imei": androidId}),
    );
    if (response.statusCode == 200) {
      print("Location sent successfully!");
    }
  }
}

class _HomePageState extends State<HomePage> {
  var socketService = SocketServices();
  var socketMessage = "";
  var statusConnectionMessage = "";

  Future<bool> _requestPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    print(permission);

    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Future<ServiceRequestResult> _startAllServices() async {
    if (await FlutterForegroundTask.isRunningService) {
      return FlutterForegroundTask.restartService();
    } else {
      return FlutterForegroundTask.startService(
        serviceId: 256,
        notificationTitle: 'Background Services Active',
        notificationText: 'Tracking location & listening notifications...',
        callback: startCombinedService,
      );
    }
  }

  void _initService() {
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'background_services',
        channelName: 'Background Services',
        channelDescription: 'Tracking location & listening notifications',
        onlyAlertOnce: true,
      ),
      iosNotificationOptions: const IOSNotificationOptions(
        showNotification: false,
        playSound: false,
      ),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(5000),
        autoRunOnBoot: true,
        autoRunOnMyPackageReplaced: true,
        allowWakeLock: true,
        allowWifiLock: true,
      ),
    );
  }

  @override
  void initState() {
    super.initState();

    _requestPermissions().then((granted) {
      if (granted) {
        socketService.connect();
        _startAllServices();
      } else {
        print("⚠️ Permission denied, socket will not connect.");
      }
    });

    _initService();

    socketService.statusConnection = (data) async {
      setState(() {
        statusConnectionMessage = data;
      });
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Socket IO"),
      ),
      body: Center(
        child: Column(
          children: <Widget>[
            Text(statusConnectionMessage),
            Text(socketMessage),
          ],
        ),
      ),
    );
  }
}
