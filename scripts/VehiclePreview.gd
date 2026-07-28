extends Control

var config: Dictionary = {}
const INK := Color("#151629")
const CREAM := Color("#fff6d5")

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func set_config(value: Dictionary) -> void:
	config = value
	queue_redraw()

func _draw() -> void:
	if config.is_empty():
		return
	var center := size * Vector2(0.5, 0.53)
	var length: float = float(config.get("length", 1.0))
	var height_scale: float = float(config.get("height", 1.0))
	var w := min(300.0, 200.0 * length)
	var h := 86.0 * height_scale
	var body: Color = config.get("body", Color.WHITE)
	var accent: Color = config.get("accent", Color.CYAN)
	var id: String = str(config.get("id", "buggy"))
	draw_set_transform(center, -0.07, Vector2.ONE)

	if id in ["supercar", "hypercar"]:
		var car := PackedVector2Array([
			Vector2(-w * 0.49, h * 0.18), Vector2(-w * 0.22, -h * 0.2),
			Vector2(w * 0.13, -h * 0.31), Vector2(w * 0.46, -h * 0.04),
			Vector2(w * 0.5, h * 0.14), Vector2(w * 0.22, h * 0.23),
			Vector2(-w * 0.4, h * 0.25)
		])
		draw_colored_polygon(car, body)
		draw_polyline(_closed(car), INK, 7.0, true)
		var glass := PackedVector2Array([
			Vector2(-w * 0.12, -h * 0.15), Vector2(w * 0.13, -h * 0.22),
			Vector2(w * 0.29, -h * 0.03), Vector2(-w * 0.02, -h * 0.02)
		])
		draw_colored_polygon(glass, accent)
		draw_polyline(_closed(glass), INK, 5.0, true)
	elif id in ["semi", "hauler"]:
		draw_rect(Rect2(-w * 0.5, -h * 0.17, w * 0.29, h * 0.42), body, true)
		draw_rect(Rect2(-w * 0.5, -h * 0.17, w * 0.29, h * 0.42), INK, false, 7.0)
		draw_rect(Rect2(-w * 0.44, -h * 0.44, w * 0.18, h * 0.24), accent, true)
		draw_rect(Rect2(-w * 0.44, -h * 0.44, w * 0.18, h * 0.24), INK, false, 5.0)
		draw_rect(Rect2(-w * 0.19, -h * 0.04, w * 0.65, h * 0.3), body, true)
		draw_rect(Rect2(-w * 0.19, -h * 0.04, w * 0.65, h * 0.3), INK, false, 7.0)
	elif id in ["dozer", "excavator", "dump"]:
		draw_rect(Rect2(-w * 0.42, -h * 0.15, w * 0.62, h * 0.4), body, true)
		draw_rect(Rect2(-w * 0.42, -h * 0.15, w * 0.62, h * 0.4), INK, false, 7.0)
		draw_rect(Rect2(-w * 0.08, -h * 0.43, w * 0.24, h * 0.24), accent, true)
		draw_rect(Rect2(-w * 0.08, -h * 0.43, w * 0.24, h * 0.24), INK, false, 5.0)
		if id == "dozer":
			var blade := PackedVector2Array([
				Vector2(w * 0.14, -h * 0.25), Vector2(w * 0.52, -h * 0.17),
				Vector2(w * 0.57, h * 0.34), Vector2(w * 0.16, h * 0.28)
			])
			draw_colored_polygon(blade, Color("#cfd4da"))
			draw_polyline(_closed(blade), INK, 6.0, true)
		elif id == "excavator":
			draw_polyline(PackedVector2Array([
				Vector2(0, -h * 0.08), Vector2(w * 0.2, -h * 0.52),
				Vector2(w * 0.52, -h * 0.66), Vector2(w * 0.63, -h * 0.25)
			]), Color("#565d68"), 14.0, true)
		else:
			var bed := PackedVector2Array([
				Vector2(-w * 0.14, -h * 0.08), Vector2(w * 0.46, -h * 0.2),
				Vector2(w * 0.48, h * 0.2), Vector2(-w * 0.1, h * 0.2)
			])
			draw_colored_polygon(bed, body)
			draw_polyline(_closed(bed), INK, 6.0, true)
	elif id == "banana":
		var banana := PackedVector2Array([
			Vector2(-w * 0.48, h * 0.1), Vector2(-w * 0.12, h * 0.42),
			Vector2(w * 0.3, h * 0.25), Vector2(w * 0.48, -h * 0.12),
			Vector2(w * 0.08, h * 0.2), Vector2(-w * 0.3, h * 0.18)
		])
		draw_colored_polygon(banana, body)
		draw_polyline(_closed(banana), INK, 7.0, true)
	else:
		draw_rect(Rect2(-w * 0.5, -h * 0.5, w, h), body, true)
		draw_rect(Rect2(-w * 0.5, -h * 0.5, w, h), INK, false, 7.0)
		draw_rect(Rect2(-w * 0.24, -h * 0.48, w * 0.42, h * 0.33), accent, true)
		draw_rect(Rect2(-w * 0.24, -h * 0.48, w * 0.42, h * 0.33), INK, false, 5.0)

	_draw_eye(Vector2(w * 0.25, -h * 0.08), 10.0)
	if id in ["semi", "hauler"]:
		_draw_wheel(Vector2(-w * 0.35, h * 0.36), 22.0)
		_draw_wheel(Vector2(-w * 0.03, h * 0.36), 20.0)
		_draw_wheel(Vector2(w * 0.19, h * 0.36), 20.0)
		_draw_wheel(Vector2(w * 0.39, h * 0.36), 20.0)
	elif id == "dump":
		_draw_wheel(Vector2(-w * 0.28, h * 0.4), 22.0)
		_draw_wheel(Vector2(0, h * 0.4), 22.0)
		_draw_wheel(Vector2(w * 0.28, h * 0.4), 22.0)
	else:
		_draw_wheel(Vector2(-w * 0.27, h * 0.4), 22.0)
		_draw_wheel(Vector2(w * 0.28, h * 0.4), 22.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_eye(pos: Vector2, radius: float) -> void:
	draw_circle(pos, radius, CREAM)
	draw_arc(pos, radius, 0.0, TAU, 24, INK, 3.0, true)
	draw_circle(pos + Vector2(radius * 0.32, 0), radius * 0.42, INK)

func _draw_wheel(pos: Vector2, radius: float) -> void:
	draw_circle(pos, radius, INK)
	draw_circle(pos, radius * 0.47, CREAM)
	draw_circle(pos, radius * 0.18, Color("#8b91a2"))

func _closed(points: PackedVector2Array) -> PackedVector2Array:
	var result := points.duplicate()
	if result.size() > 0:
		result.append(result[0])
	return result
