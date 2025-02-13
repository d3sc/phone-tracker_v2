import 'dart:ffi';

import 'package:app/socket_services.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:geolocator/geolocator.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
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

  @override
  void initState() {
    super.initState();

    _requestPermissions().then((granted) {
      if (granted) {
        socketService.connect();
      } else {
        print("⚠️ Permission denied, socket will not connect.");
      }
    });

    Future<void> _sendLocationToServer(
        double latitude, double longitude) async {
      final url = Uri.parse('https://server-js.d3sc.my.id/location');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(
            {'latitude': latitude, 'longitude': longitude, "imei": "111"}),
      );
      if (response.statusCode == 200) {
        print("Location sent successfully!");
      }
    }

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

    socketService.getLocationEvent = (data) async {
      setState(() {
        socketMessage = data;
      });

      await _getCurrentLocation();
    };
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
