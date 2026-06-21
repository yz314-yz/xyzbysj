import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;

class DiagnosisResponse {
  final bool success;
  final String blueprint;
  final Map<String, dynamic>? meta;

  DiagnosisResponse({
    required this.success,
    required this.blueprint,
    this.meta,
  });

  factory DiagnosisResponse.fromJson(Map<String, dynamic> json) {
    return DiagnosisResponse(
      success: json['success'] ?? false,
      blueprint: json['blueprint'] ?? '',
      meta: json['meta'],
    );
  }
}

class WeatherData {
  final int temperature;
  final int humidity;
  final String airQuality;
  final String uvLevel;

  WeatherData({
    required this.temperature,
    required this.humidity,
    required this.airQuality,
    required this.uvLevel,
  });

  factory WeatherData.fromJson(Map<String, dynamic> json) {
    return WeatherData(
      temperature: json['temperature'] ?? 25,
      humidity: json['humidity'] ?? 60,
      airQuality: json['airQuality'] ?? '优',
      uvLevel: json['uvLevel'] ?? '弱',
    );
  }
}

class ApiService {
  final String baseUrl;
  final http.Client _client;

  ApiService({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  Future<WeatherData> getCurrentWeather() async {
    try {
      final response = await _client
          .get(Uri.parse('$baseUrl/api/v1/weather/current'))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body)['data'];
        return WeatherData.fromJson(data);
      }
      throw Exception('获取天气失败');
    } catch (e) {
      return WeatherData(
        temperature: 28,
        humidity: 85,
        airQuality: '优',
        uvLevel: '弱',
      );
    }
  }

  Future<DiagnosisResponse> diagnose({
    required String symptoms,
    required int temperature,
    required int humidity,
    required int currentHour,
    Uint8List? imageBytes,
    bool hasFacePhoto = false,
    bool hasTonguePhoto = false,
  }) async {
    final uri = Uri.parse('$baseUrl/api/v1/sync/diagnose');
    final request = http.MultipartRequest('POST', uri);

    request.fields['symptoms'] = symptoms;
    request.fields['temperature'] = temperature.toString();
    request.fields['humidity'] = humidity.toString();
    request.fields['currentHour'] = currentHour.toString();
    request.fields['hasFacePhoto'] = hasFacePhoto.toString();
    request.fields['hasTonguePhoto'] = hasTonguePhoto.toString();

    if (imageBytes != null) {
      request.files.add(
        http.MultipartFile.fromBytes('image', imageBytes, filename: 'photo.jpg'),
      );
    }

    final streamResponse = await request.send().timeout(
      const Duration(seconds: 120),
    );

    final response = await http.Response.fromStream(streamResponse);

    if (response.statusCode == 200) {
      return DiagnosisResponse.fromJson(json.decode(response.body));
    }
    throw Exception('诊断失败: ${response.statusCode}');
  }
}
