// Data models mirroring the backend's normalized DTOs.

double _toDouble(dynamic v) => v == null ? 0 : (v is num ? v.toDouble() : double.tryParse('$v') ?? 0);
int _toInt(dynamic v) => v == null ? 0 : (v is num ? v.toInt() : int.tryParse('$v') ?? 0);

class AppUser {
  final String id, email, role;
  final String? name, phone, country;
  AppUser({required this.id, required this.email, required this.role, this.name, this.phone, this.country});
  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: '${j['id']}',
        email: '${j['email']}',
        role: '${j['role'] ?? 'customer'}',
        name: j['name'],
        phone: j['phone'],
        country: j['country'],
      );
}

class Country {
  final int id;
  final String name;
  final String? flag;
  Country({required this.id, required this.name, this.flag});
  factory Country.fromJson(Map<String, dynamic> j) =>
      Country(id: _toInt(j['id']), name: '${j['name']}', flag: j['flag']);
}

class Continent {
  final int id;
  final String name;
  final String? flag;
  Continent({required this.id, required this.name, this.flag});
  factory Continent.fromJson(Map<String, dynamic> j) =>
      Continent(id: _toInt(j['id']), name: '${j['name']}', flag: j['flag']);
}

class Network {
  final String name;
  final List<String> generations;
  Network({required this.name, required this.generations});
  factory Network.fromJson(Map<String, dynamic> j) => Network(
        name: '${j['name']}',
        generations: (j['generations'] as List? ?? []).map((e) => '$e').toList(),
      );
}

class CountryCoverage {
  final String country;
  final String? flag;
  final List<Network> networks;
  CountryCoverage({required this.country, this.flag, required this.networks});
  factory CountryCoverage.fromJson(Map<String, dynamic> j) => CountryCoverage(
        country: '${j['country']}',
        flag: j['flag'],
        networks: (j['networks'] as List? ?? [])
            .map((e) => Network.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class Package {
  final String id, name, type;
  final String? scope, connectivity, activationType;
  final num dataQuantity;
  final String dataUnit;
  final bool unlimited, tether;
  final int validityQuantity;
  final String validityUnit;
  final double retail;
  final String currency;
  final List<CountryCoverage> coverage;

  Package({
    required this.id,
    required this.name,
    required this.type,
    required this.scope,
    required this.dataQuantity,
    required this.dataUnit,
    required this.unlimited,
    required this.tether,
    required this.validityQuantity,
    required this.validityUnit,
    required this.retail,
    required this.currency,
    required this.connectivity,
    required this.activationType,
    required this.coverage,
  });

  factory Package.fromJson(Map<String, dynamic> j) {
    final data = j['data'] as Map<String, dynamic>? ?? {};
    final validity = j['validity'] as Map<String, dynamic>? ?? {};
    final price = j['price'] as Map<String, dynamic>? ?? {};
    final features = j['features'] as Map<String, dynamic>? ?? {};
    return Package(
      id: '${j['id']}',
      name: '${j['name']}',
      type: '${j['type'] ?? 'DATA-ONLY'}',
      scope: j['scope'],
      dataQuantity: _toDouble(data['quantity']),
      dataUnit: '${data['unit'] ?? 'GB'}',
      unlimited: data['unlimited'] == true,
      tether: features['tether'] == true,
      validityQuantity: _toInt(validity['quantity']),
      validityUnit: '${validity['unit'] ?? 'Day'}',
      retail: _toDouble(price['retail']),
      currency: '${price['currency'] ?? 'USD'}',
      connectivity: features['connectivity'],
      activationType: features['activationType'],
      coverage: (j['coverage'] as List? ?? [])
          .map((e) => CountryCoverage.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  String get dataLabel =>
      unlimited ? 'Unlimited' : '${dataQuantity % 1 == 0 ? dataQuantity.toInt() : dataQuantity} $dataUnit';
  String get validityLabel =>
      '$validityQuantity ${validityUnit.toLowerCase()}${validityQuantity == 1 ? '' : 's'}';
  String get topGeneration {
    final all = <String>{};
    for (final c in coverage) {
      for (final n in c.networks) {
        all.addAll(n.generations);
      }
    }
    for (final g in ['5G', '4G', '3G', '2G']) {
      if (all.contains(g)) return g;
    }
    return '';
  }
}

class EsimRow {
  final String id, iccid, status;
  final String? lastBundle, qrCodeText, smdpAddress, matchingId, universalLinkIos, universalLinkAndroid, apn, createdAt;
  EsimRow({
    required this.id,
    required this.iccid,
    required this.status,
    this.lastBundle,
    this.qrCodeText,
    this.smdpAddress,
    this.matchingId,
    this.universalLinkIos,
    this.universalLinkAndroid,
    this.apn,
    this.createdAt,
  });
  factory EsimRow.fromJson(Map<String, dynamic> j) => EsimRow(
        id: '${j['id']}',
        iccid: '${j['iccid'] ?? ''}',
        status: '${j['status'] ?? ''}',
        lastBundle: j['lastBundle'],
        qrCodeText: j['qrCodeText'],
        smdpAddress: j['smdpAddress'],
        matchingId: j['matchingId'],
        universalLinkIos: j['universalLinkIos'],
        universalLinkAndroid: j['universalLinkAndroid'],
        apn: j['apn'],
        createdAt: j['createdAt'],
      );
}

class OrderRow {
  final String id, packageName, status, currency;
  final double retailPrice;
  final String? esimId, createdAt, failureReason;
  OrderRow({
    required this.id,
    required this.packageName,
    required this.status,
    required this.currency,
    required this.retailPrice,
    this.esimId,
    this.createdAt,
    this.failureReason,
  });
  factory OrderRow.fromJson(Map<String, dynamic> j) => OrderRow(
        id: '${j['id']}',
        packageName: '${j['packageName']}',
        status: '${j['status']}',
        currency: '${j['currency'] ?? 'USD'}',
        retailPrice: _toDouble(j['retailPrice']),
        esimId: j['esimId'],
        createdAt: j['createdAt'],
        failureReason: j['failureReason'],
      );
}

class Usage {
  final dynamic initialQuantity, remainingQuantity; // num or "Unlimited"
  final String initialUnit, remainingUnit;
  final bool mock;
  Usage({
    required this.initialQuantity,
    required this.remainingQuantity,
    required this.initialUnit,
    required this.remainingUnit,
    this.mock = false,
  });
  factory Usage.fromJson(Map<String, dynamic> j) => Usage(
        initialQuantity: j['initialQuantity'],
        remainingQuantity: j['remainingQuantity'],
        initialUnit: '${j['initialUnit'] ?? 'GB'}',
        remainingUnit: '${j['remainingUnit'] ?? 'GB'}',
        mock: j['mock'] == true,
      );
  bool get unlimited => '$remainingQuantity' == 'Unlimited';
}

/// Result of starting a checkout (Stripe URL when live, else dev-simulated).
class CheckoutResult {
  final String orderId;
  final String? checkoutUrl;
  CheckoutResult(this.orderId, this.checkoutUrl);
}
