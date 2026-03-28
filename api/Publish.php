<?php
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$slug = isset($data["slug"]) ? preg_replace('/[^a-z0-9\-]/', '', strtolower($data["slug"])) : "";
$html = isset($data["html"]) ? $data["html"] : "";

if (!$slug || !$html) {
    echo json_encode(["success" => false, "error" => "Missing data"]);
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
<style>
body { font-family: Arial, sans-serif; padding: 40px; background:#0f172a; color:white; }
a { display:inline-block; padding:10px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:6px; }
section { margin-bottom: 20px; padding: 20px; background:#111827; border-radius: 10px; }
</style>
</head>
<body>
$html
</body>
</html>";

file_put_contents($siteDir . "/index.html", $fullHTML);

echo json_encode([
    "success" => true,
    "url" => "http://10builder.com/sites/$slug/"
]);
