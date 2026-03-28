<?php
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$slug = isset($data["slug"]) ? preg_replace('/[^a-z0-9\-]/', '', strtolower($data["slug"])) : "";
$html = isset($data["html"]) ? $data["html"] : "";
$user = isset($data["user"]) ? $data["user"] : "guest";

if (!$slug || !$html) {
    echo json_encode(["success" => false, "error" => "Missing slug or html"]);
    exit;
}

$baseDir = "/var/www/10builder/sites/";
$siteDir = $baseDir . $slug;

if (!file_exists($siteDir)) {
    mkdir($siteDir, 0775, true);
}

$fullHTML = "<!DOCTYPE html>
<html>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<title>$slug</title>
<link rel='stylesheet' href='/styles.css?v=500'>
</head>
<body>$html</body>
</html>";

file_put_contents($siteDir . "/index.html", $fullHTML);

/* -------- SAVE METADATA -------- */

$dbPath = "/var/www/10builder/data/sites.json";
$sites = [];

if (file_exists($dbPath)) {
    $sites = json_decode(file_get_contents($dbPath), true);
}

$found = false;

foreach ($sites as &$site) {
    if ($site["slug"] === $slug) {
        $site["updated"] = time();
        $found = true;
        break;
    }
}

if (!$found) {
    $sites[] = [
        "slug" => $slug,
        "user" => $user,
        "created" => time(),
        "updated" => time()
    ];
}

file_put_contents($dbPath, json_encode($sites, JSON_PRETTY_PRINT));

echo json_encode([
    "success" => true,
    "url" => "/sites/$slug/"
]);
