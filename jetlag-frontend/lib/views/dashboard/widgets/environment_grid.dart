import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/services/api_service.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

class EnvironmentGrid extends StatelessWidget {
  final WeatherData weather;

  const EnvironmentGrid({
    super.key,
    required this.weather,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _EnvironmentCard(
                icon: '🌡️',
                label: '温度',
                value: '${weather.temperature}°C',
                subLabel: weather.temperature > 28 ? '偏高' : '正常',
                isWarning: weather.temperature > 28,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _EnvironmentCard(
                icon: '💧',
                label: '湿度',
                value: '${weather.humidity}%',
                subLabel: weather.humidity > 80 ? '湿气重' : '正常',
                isWarning: weather.humidity > 80,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _EnvironmentCard(
                icon: '🌬️',
                label: '空气质量',
                value: weather.airQuality,
                subLabel: '良好',
                isWarning: false,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _EnvironmentCard(
                icon: '☀️',
                label: '紫外线',
                value: weather.uvLevel,
                subLabel: '温和',
                isWarning: false,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _EnvironmentCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  final String subLabel;
  final bool isWarning;

  const _EnvironmentCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.subLabel,
    required this.isWarning,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardSurface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Text(icon, style: const TextStyle(fontSize: 16)),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.primaryText,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.secondaryText,
                ),
              ),
              const SizedBox(width: 6),
              if (isWarning)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.amber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    subLabel,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.amber,
                    ),
                  ),
                )
              else
                Text(
                  subLabel,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.secondaryText,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
