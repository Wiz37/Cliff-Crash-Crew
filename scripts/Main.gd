extends Node2D

const VehiclePreview = preload("res://scripts/VehiclePreview.gd")
const VIRTUAL_SIZE := Vector2(1080.0, 1920.0)
const INK := Color("#151629")
const CREAM := Color("#fff6d5")
const SKY_TOP := Color("#39c9ff")
const SKY_BOTTOM := Color("#d7f8ff")
const GRASS := Color("#58b957")
const GRASS_DARK := Color("#257840")
const STAR := Color("#ffd43b")
const PINK := Color("#ff4d86")
const CYAN := Color("#58ddff")
const ORANGE := Color("#ff8a34")

enum GameMode { MENU, GARAGE, PLAYING, RESULTS }

var mode := GameMode.MENU
var rng := RandomNumberGenerator.new()
var time_alive := 0.0
var menu_bob := 0.0

var vehicles := [
	{"id":"buggy", "name":"BOUNCE BUGGY", "category":"CLASSICS", "price":0, "body":Color("#ff5cab"), "accent":STAR, "power":1.0, "spin":1.12, "mass":1.0, "length":1.0, "height":1.0, "description":"Easy flips and giant bounces."},
	{"id":"bus", "name":"CHONKY BUS", "category":"CLASSICS", "price":90, "body":STAR, "accent":CYAN, "power":0.93, "spin":0.72, "mass":1.35, "length":1.18, "height":1.12, "description":"Heavy enough to flatten towers."},
	{"id":"rocket", "name":"ROCKET VAN", "category":"CLASSICS", "price":180, "body":CYAN, "accent":ORANGE, "power":1.18, "spin":1.0, "mass":1.05, "length":1.08, "height":1.0, "description":"Fast launch with wild landings."},
	{"id":"banana", "name":"BANANA BLASTER", "category":"CLASSICS", "price":320, "body":Color("#ffe74a"), "accent":Color("#6fdb66"), "power":1.12, "spin":1.35, "mass":0.9, "length":1.05, "height":0.92, "description":"A ridiculous flip machine."},
	{"id":"dozer", "name":"DOZER DASHER", "category":"CONSTRUCTION", "price":450, "body":Color("#f7b731"), "accent":Color("#ffdd59"), "power":1.02, "spin":0.76, "mass":1.55, "length":1.3, "height":1.08, "description":"A giant blade built for destruction."},
	{"id":"excavator", "name":"MEGA DIGGER", "category":"CONSTRUCTION", "price":620, "body":Color("#ffa94d"), "accent":Color("#dbe4ff"), "power":0.98, "spin":0.88, "mass":1.45, "length":1.22, "height":1.15, "description":"The boom arm makes every crash weird."},
	{"id":"dump", "name":"DUMP CRUSHER", "category":"CONSTRUCTION", "price":820, "body":Color("#ff922b"), "accent":Color("#74c0fc"), "power":1.08, "spin":0.67, "mass":1.75, "length":1.42, "height":1.2, "description":"Huge dump bed. Huge impact bonus."},
	{"id":"supercar", "name":"TURBO TIGER", "category":"SUPERCARS", "price":1050, "body":Color("#ff4d6d"), "accent":Color("#f8f9fa"), "power":1.28, "spin":1.2, "mass":0.88, "length":1.28, "height":0.78, "description":"Low, fast, flashy and loud."},
	{"id":"hypercar", "name":"NEON HYPER GT", "category":"SUPERCARS", "price":1380, "body":Color("#7b61ff"), "accent":Color("#68f5ff"), "power":1.36, "spin":1.3, "mass":0.82, "length":1.32, "height":0.74, "description":"Maximum speed and ridiculous flips."},
	{"id":"semi", "name":"BIG RIG BLAST", "category":"SEMIS", "price":1750, "body":Color("#3bc9db"), "accent":Color("#f1f3f5"), "power":1.14, "spin":0.56, "mass":2.0, "length":1.78, "height":1.08, "description":"Monster momentum in a classic semi."},
	{"id":"hauler", "name":"MEGA HAULER", "category":"SEMIS", "price":2200, "body":Color("#69db7c"), "accent":STAR, "power":1.22, "spin":0.48, "mass":2.35, "length":2.05, "height":1.14, "description":"The longest, heaviest tower bulldozer."}
]

var challenges := [
	{"type":"blocks", "target":10.0, "text":"BREAK 10 BLOCKS", "bonus":18},
	{"type":"flips", "target":2.0, "text":"LAND 2 FLIPS", "bonus":22},
	{"type":"distance", "target":180.0, "text":"FLY 180 METERS", "bonus":18},
	{"type":"score", "target":5200.0, "text":"SCORE 5,200", "bonus":25}
]

var selected_vehicle_id := "buggy"
var unlocked := ["buggy"]
var stars := 0
var best_score := 0
var sound_enabled := true
var music_enabled := true

var charge := 0.08
var charge_direction := 1.0
var charging := false
var launched := false
var run_time := 0.0
var settle_time := 0.0
var score := 0.0
var flips := 0
var blocks_broken := 0
var distance_m := 0.0
var earned_stars := 0
var current_challenge := {}
var challenge_complete := false
var camera_x := 0.0
var camera_y := 0.0
var shake := 0.0
var flash := 0.0
var slow_motion := 0.0
var vehicle := {}
var blocks := []
var particles := []
var debris := []
var clouds := []

var ui_layer: CanvasLayer
var menu_panel: Control
var garage_panel: Control
var hud_panel: Control
var results_panel: Control
var garage_list: VBoxContainer
var garage_stars_label: Label
var score_label: Label
var best_label: Label
var hud_stars_label: Label
var challenge_label: Label
var charge_fill: ColorRect
var charge_box: Control
var tilt_left_button: Button
var tilt_right_button: Button
var result_score_label: Label
var result_stats_label: Label
var result_challenge_label: Label
var result_title_label: Label
var sound_button: Button

var music_player: AudioStreamPlayer
var engine_player: AudioStreamPlayer
var sfx_players := []
var streams := {}

func _ready() -> void:
	rng.randomize()
	load_save()
	setup_clouds()
	setup_audio()
	build_ui()
	show_menu()
	queue_redraw()

func setup_audio() -> void:
	streams = {
		"click": load("res://audio/ui_click.wav"),
		"launch": load("res://audio/launch.wav"),
		"impact1": load("res://audio/impact_1.wav"),
		"impact2": load("res://audio/impact_2.wav"),
		"impact3": load("res://audio/impact_3.wav"),
		"break": load("res://audio/break.wav"),
		"star": load("res://audio/star.wav")
	}
	music_player = AudioStreamPlayer.new()
	var music_stream = load("res://audio/music_loop.wav")
	if music_stream is AudioStreamWAV:
		music_stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	music_player.stream = music_stream
	music_player.volume_db = -10.0
	add_child(music_player)
	engine_player = AudioStreamPlayer.new()
	var engine_stream = load("res://audio/engine_loop.wav")
	if engine_stream is AudioStreamWAV:
		engine_stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	engine_player.stream = engine_stream
	engine_player.volume_db = -18.0
	add_child(engine_player)
	for i in range(8):
		var player := AudioStreamPlayer.new()
		add_child(player)
		sfx_players.append(player)
	if music_enabled:
		music_player.play()

func play_sfx(name: String, pitch := 1.0, volume_db := 0.0) -> void:
	if not sound_enabled or not streams.has(name):
		return
	for player in sfx_players:
		if not player.playing:
			player.stream = streams[name]
			player.pitch_scale = pitch
			player.volume_db = volume_db
			player.play()
			return
	var fallback: AudioStreamPlayer = sfx_players[0]
	fallback.stop()
	fallback.stream = streams[name]
	fallback.pitch_scale = pitch
	fallback.volume_db = volume_db
	fallback.play()

func setup_clouds() -> void:
	clouds.clear()
	for i in range(22):
		clouds.append({
			"x": float(i * 260 + rng.randi_range(-80, 90)),
			"y": float(rng.randi_range(120, 560)),
			"scale": rng.randf_range(0.55, 1.25)
		})

func full_control(node_name: String) -> Control:
	var control := Control.new()
	control.name = node_name
	control.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	return control

func make_style(color: Color, radius := 28, border_color := Color.TRANSPARENT, border_width := 0, shadow := true) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.border_width_left = border_width
	style.border_width_top = border_width
	style.border_width_right = border_width
	style.border_width_bottom = border_width
	style.border_color = border_color
	if shadow:
		style.shadow_color = Color(0.02, 0.02, 0.08, 0.28)
		style.shadow_size = 14
		style.shadow_offset = Vector2(0, 10)
	return style

func style_button(button: Button, color: Color, font_size := 44, min_size := Vector2(500, 116)) -> void:
	button.custom_minimum_size = min_size
	button.add_theme_font_size_override("font_size", font_size)
	button.add_theme_color_override("font_color", CREAM)
	button.add_theme_color_override("font_hover_color", Color.WHITE)
	button.add_theme_color_override("font_pressed_color", Color.WHITE)
	button.add_theme_stylebox_override("normal", make_style(color, 34, INK, 6))
	button.add_theme_stylebox_override("hover", make_style(color.lightened(0.08), 34, INK, 6))
	button.add_theme_stylebox_override("pressed", make_style(color.darkened(0.12), 34, INK, 6, false))
	button.mouse_entered.connect(func(): button.create_tween().tween_property(button, "scale", Vector2(1.03, 1.03), 0.08))
	button.mouse_exited.connect(func(): button.create_tween().tween_property(button, "scale", Vector2.ONE, 0.08))

func make_label(text: String, size: int, color := CREAM, align := HORIZONTAL_ALIGNMENT_CENTER) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0.03, 0.03, 0.08, 0.65))
	label.add_theme_constant_override("shadow_offset_x", 4)
	label.add_theme_constant_override("shadow_offset_y", 5)
	label.horizontal_alignment = align
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label

func build_ui() -> void:
	ui_layer = CanvasLayer.new()
	add_child(ui_layer)
	menu_panel = full_control("Menu")
	garage_panel = full_control("Garage")
	hud_panel = full_control("HUD")
	results_panel = full_control("Results")
	ui_layer.add_child(menu_panel)
	ui_layer.add_child(garage_panel)
	ui_layer.add_child(hud_panel)
	ui_layer.add_child(results_panel)
	build_menu_ui()
	build_garage_ui()
	build_hud_ui()
	build_results_ui()

func build_menu_ui() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 70)
	margin.add_theme_constant_override("margin_right", 70)
	margin.add_theme_constant_override("margin_top", 64)
	margin.add_theme_constant_override("margin_bottom", 52)
	menu_panel.add_child(margin)
	var root := VBoxContainer.new()
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 18)
	margin.add_child(root)

	var top_row := HBoxContainer.new()
	top_row.alignment = BoxContainer.ALIGNMENT_END
	root.add_child(top_row)
	sound_button = Button.new()
	sound_button.text = "SFX ON" if sound_enabled else "SFX OFF"
	style_button(sound_button, Color("#30324f"), 23, Vector2(150, 78))
	sound_button.pressed.connect(toggle_sound)
	top_row.add_child(sound_button)

	var badge_panel := PanelContainer.new()
	badge_panel.custom_minimum_size = Vector2(450, 70)
	badge_panel.add_theme_stylebox_override("panel", make_style(STAR, 28, INK, 5))
	var badge := make_label("NEW VEHICLES!", 34, INK)
	badge_panel.add_child(badge)
	root.add_child(badge_panel)

	var title := make_label("CLIFF\nCRASH\nCREW", 112, CREAM)
	title.custom_minimum_size = Vector2(900, 390)
	title.add_theme_color_override("font_outline_color", INK)
	title.add_theme_constant_override("outline_size", 18)
	root.add_child(title)

	var subtitle := make_label("LAUNCH  •  FLIP  •  SMASH", 34, CYAN)
	subtitle.add_theme_color_override("font_outline_color", INK)
	subtitle.add_theme_constant_override("outline_size", 8)
	root.add_child(subtitle)

	var vehicle_space := Control.new()
	vehicle_space.custom_minimum_size = Vector2(900, 360)
	vehicle_space.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(vehicle_space)

	var play_button := Button.new()
	play_button.text = "PLAY"
	style_button(play_button, PINK, 54, Vector2(700, 132))
	play_button.pressed.connect(_on_play_pressed)
	root.add_child(play_button)

	var garage_button := Button.new()
	garage_button.text = "GARAGE"
	style_button(garage_button, Color("#424563"), 42, Vector2(620, 112))
	garage_button.pressed.connect(_on_garage_pressed)
	root.add_child(garage_button)

	var safe_text := make_label("TOY CRASHES • NO CHAT • NO GORE", 24, Color(1, 1, 1, 0.76))
	root.add_child(safe_text)

func build_garage_ui() -> void:
	var shade := ColorRect.new()
	shade.color = Color(0.05, 0.06, 0.13, 0.94)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	garage_panel.add_child(shade)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 46)
	margin.add_theme_constant_override("margin_right", 46)
	margin.add_theme_constant_override("margin_top", 58)
	margin.add_theme_constant_override("margin_bottom", 46)
	garage_panel.add_child(margin)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 18)
	margin.add_child(root)
	var header := HBoxContainer.new()
	root.add_child(header)
	var back := Button.new()
	back.text = "BACK"
	style_button(back, Color("#424563"), 22, Vector2(145, 84))
	back.pressed.connect(_on_home_pressed)
	header.add_child(back)
	var garage_title := make_label("GARAGE", 62, CREAM)
	garage_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(garage_title)
	garage_stars_label = make_label("★ 0", 36, STAR, HORIZONTAL_ALIGNMENT_RIGHT)
	garage_stars_label.custom_minimum_size = Vector2(220, 84)
	header.add_child(garage_stars_label)
	var tabs := make_label("CLASSICS  •  CONSTRUCTION  •  SUPERCARS  •  SEMIS", 23, CYAN)
	root.add_child(tabs)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	root.add_child(scroll)
	garage_list = VBoxContainer.new()
	garage_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	garage_list.add_theme_constant_override("separation", 20)
	scroll.add_child(garage_list)

func build_hud_ui() -> void:
	var top_margin := MarginContainer.new()
	top_margin.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_margin.offset_bottom = 260
	top_margin.add_theme_constant_override("margin_left", 28)
	top_margin.add_theme_constant_override("margin_right", 28)
	top_margin.add_theme_constant_override("margin_top", 36)
	hud_panel.add_child(top_margin)
	var top := VBoxContainer.new()
	top.add_theme_constant_override("separation", 12)
	top_margin.add_child(top)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	top.add_child(row)
	score_label = hud_pill("SCORE\n0")
	best_label = hud_pill("BEST\n0")
	hud_stars_label = hud_pill("★\n0", STAR)
	row.add_child(score_label.get_parent())
	row.add_child(best_label.get_parent())
	row.add_child(hud_stars_label.get_parent())
	var challenge_panel := PanelContainer.new()
	challenge_panel.custom_minimum_size = Vector2(0, 74)
	challenge_panel.add_theme_stylebox_override("panel", make_style(Color(0.08, 0.09, 0.18, 0.88), 26, CYAN, 4))
	challenge_label = make_label("BREAK 10 BLOCKS", 28, CREAM)
	challenge_panel.add_child(challenge_label)
	top.add_child(challenge_panel)

	charge_box = Control.new()
	charge_box.position = Vector2(190, 1550)
	charge_box.size = Vector2(700, 190)
	hud_panel.add_child(charge_box)
	var charge_panel := Panel.new()
	charge_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	charge_panel.add_theme_stylebox_override("panel", make_style(Color(0.08, 0.09, 0.18, 0.92), 38, CREAM, 5))
	charge_box.add_child(charge_panel)
	var charge_label := make_label("HOLD TO CHARGE", 34, CREAM)
	charge_label.position = Vector2(30, 16)
	charge_label.size = Vector2(640, 62)
	charge_box.add_child(charge_label)
	var track := ColorRect.new()
	track.color = Color("#2c2e48")
	track.position = Vector2(42, 100)
	track.size = Vector2(616, 48)
	charge_box.add_child(track)
	charge_fill = ColorRect.new()
	charge_fill.color = PINK
	charge_fill.position = track.position + Vector2(5, 5)
	charge_fill.size = Vector2(50, 38)
	charge_box.add_child(charge_fill)

	tilt_left_button = Button.new()
	tilt_left_button.text = "↶"
	style_button(tilt_left_button, Color(0.08, 0.09, 0.18, 0.86), 76, Vector2(230, 190))
	tilt_left_button.position = Vector2(60, 1640)
	tilt_left_button.pressed.connect(_on_tilt_left)
	hud_panel.add_child(tilt_left_button)
	tilt_right_button = Button.new()
	tilt_right_button.text = "↷"
	style_button(tilt_right_button, Color(0.08, 0.09, 0.18, 0.86), 76, Vector2(230, 190))
	tilt_right_button.position = Vector2(790, 1640)
	tilt_right_button.pressed.connect(_on_tilt_right)
	hud_panel.add_child(tilt_right_button)

func hud_pill(text: String, color := CREAM) -> Label:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.custom_minimum_size = Vector2(0, 118)
	panel.add_theme_stylebox_override("panel", make_style(Color(0.08, 0.09, 0.18, 0.86), 30, INK, 4))
	var label := make_label(text, 30, color)
	panel.add_child(label)
	return label

func build_results_ui() -> void:
	var shade := ColorRect.new()
	shade.color = Color(0.03, 0.04, 0.1, 0.8)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	results_panel.add_child(shade)
	var card := PanelContainer.new()
	card.position = Vector2(90, 300)
	card.size = Vector2(900, 1280)
	card.add_theme_stylebox_override("panel", make_style(Color("#21233d"), 54, CREAM, 7))
	results_panel.add_child(card)
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 55)
	margin.add_theme_constant_override("margin_right", 55)
	margin.add_theme_constant_override("margin_top", 48)
	margin.add_theme_constant_override("margin_bottom", 48)
	card.add_child(margin)
	var root := VBoxContainer.new()
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 24)
	margin.add_child(root)
	result_title_label = make_label("CRASH COMPLETE!", 46, CYAN)
	root.add_child(result_title_label)
	result_score_label = make_label("0", 132, STAR)
	result_score_label.add_theme_color_override("font_outline_color", INK)
	result_score_label.add_theme_constant_override("outline_size", 14)
	root.add_child(result_score_label)
	root.add_child(make_label("TOTAL SCORE", 27, Color(1, 1, 1, 0.65)))
	var stats_panel := PanelContainer.new()
	stats_panel.custom_minimum_size = Vector2(670, 350)
	stats_panel.add_theme_stylebox_override("panel", make_style(Color(0.08, 0.09, 0.18, 0.76), 32, INK, 4, false))
	result_stats_label = make_label("DISTANCE   0m\nFLIPS          0\nBLOCKS      0\nSTARS        +0", 38, CREAM, HORIZONTAL_ALIGNMENT_LEFT)
	stats_panel.add_child(result_stats_label)
	root.add_child(stats_panel)
	result_challenge_label = make_label("TRY AGAIN", 29, CREAM)
	result_challenge_label.custom_minimum_size = Vector2(680, 105)
	result_challenge_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root.add_child(result_challenge_label)
	var again := Button.new()
	again.text = "CRASH AGAIN"
	style_button(again, PINK, 43, Vector2(670, 126))
	again.pressed.connect(_on_play_pressed)
	root.add_child(again)
	var garage := Button.new()
	garage.text = "GARAGE"
	style_button(garage, Color("#424563"), 38, Vector2(590, 106))
	garage.pressed.connect(_on_garage_pressed)
	root.add_child(garage)
	var home := Button.new()
	home.text = "HOME"
	style_button(home, Color("#30324f"), 34, Vector2(470, 94))
	home.pressed.connect(_on_home_pressed)
	root.add_child(home)

func _on_play_pressed() -> void:
	play_sfx("click")
	start_game()

func _on_garage_pressed() -> void:
	play_sfx("click")
	show_garage()

func _on_home_pressed() -> void:
	play_sfx("click")
	show_menu()

func _on_tilt_left() -> void:
	tilt_vehicle(-1.0)

func _on_tilt_right() -> void:
	tilt_vehicle(1.0)

func toggle_sound() -> void:
	sound_enabled = not sound_enabled
	music_enabled = sound_enabled
	sound_button.text = "SFX ON" if sound_enabled else "SFX OFF"
	if music_enabled:
		if not music_player.playing:
			music_player.play()
	else:
		music_player.stop()
		engine_player.stop()
	save_progress()

func show_menu() -> void:
	mode = GameMode.MENU
	camera_x = 0.0
	camera_y = 0.0
	menu_panel.visible = true
	garage_panel.visible = false
	hud_panel.visible = false
	results_panel.visible = false
	engine_player.stop()
	queue_redraw()

func show_garage() -> void:
	mode = GameMode.GARAGE
	camera_x = 0.0
	camera_y = 0.0
	menu_panel.visible = false
	garage_panel.visible = true
	hud_panel.visible = false
	results_panel.visible = false
	engine_player.stop()
	rebuild_garage()
	queue_redraw()

func rebuild_garage() -> void:
	garage_stars_label.text = "★ %s" % format_number(stars)
	for child in garage_list.get_children():
		child.queue_free()
	var last_category := ""
	for config in vehicles:
		if str(config.category) != last_category:
			var category_label := make_label(str(config.category), 28, CYAN, HORIZONTAL_ALIGNMENT_LEFT)
			category_label.custom_minimum_size = Vector2(0, 56)
			garage_list.add_child(category_label)
			last_category = str(config.category)
		garage_list.add_child(make_vehicle_card(config))

func make_vehicle_card(config: Dictionary) -> Control:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(970, 310)
	var is_selected := selected_vehicle_id == str(config.id)
	var is_unlocked := unlocked.has(str(config.id))
	var border := STAR if is_selected else Color("#3a3d5c")
	card.add_theme_stylebox_override("panel", make_style(Color("#20233d"), 36, border, 6))
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 24)
	margin.add_theme_constant_override("margin_right", 24)
	margin.add_theme_constant_override("margin_top", 18)
	margin.add_theme_constant_override("margin_bottom", 18)
	card.add_child(margin)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 22)
	margin.add_child(row)
	var preview := VehiclePreview.new()
	preview.custom_minimum_size = Vector2(390, 250)
	preview.set_config(config)
	row.add_child(preview)
	var info := VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.alignment = BoxContainer.ALIGNMENT_CENTER
	info.add_theme_constant_override("separation", 8)
	row.add_child(info)
	var name_label := make_label(str(config.name), 31, CREAM, HORIZONTAL_ALIGNMENT_LEFT)
	info.add_child(name_label)
	var desc := make_label(str(config.description), 22, Color(1, 1, 1, 0.72), HORIZONTAL_ALIGNMENT_LEFT)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.custom_minimum_size = Vector2(0, 68)
	info.add_child(desc)
	var stat := make_label("POWER %d   •   SPIN %d" % [roundi(float(config.power) * 100.0), roundi(float(config.spin) * 100.0)], 20, CYAN, HORIZONTAL_ALIGNMENT_LEFT)
	info.add_child(stat)
	var button := Button.new()
	if is_unlocked:
		button.text = "SELECTED" if is_selected else "USE"
	else:
		button.text = "UNLOCK  ★ %s" % format_number(int(config.price))
	style_button(button, PINK if is_unlocked else Color("#4a4d6e"), 26, Vector2(430, 74))
	button.pressed.connect(func(): choose_vehicle(config, button))
	info.add_child(button)
	return card

func choose_vehicle(config: Dictionary, button: Button) -> void:
	play_sfx("click")
	var id := str(config.id)
	if unlocked.has(id):
		selected_vehicle_id = id
	elif stars >= int(config.price):
		stars -= int(config.price)
		unlocked.append(id)
		selected_vehicle_id = id
		play_sfx("star", 1.0, -2.0)
	else:
		button.text = "NEED MORE STARS"
		var timer := get_tree().create_timer(0.9)
		timer.timeout.connect(rebuild_garage)
		return
	save_progress()
	rebuild_garage()

func start_game() -> void:
	mode = GameMode.PLAYING
	menu_panel.visible = false
	garage_panel.visible = false
	hud_panel.visible = true
	results_panel.visible = false
	reset_run()

func reset_run() -> void:
	charge = 0.08
	charge_direction = 1.0
	charging = false
	launched = false
	run_time = 0.0
	settle_time = 0.0
	score = 0.0
	flips = 0
	blocks_broken = 0
	distance_m = 0.0
	earned_stars = 0
	current_challenge = challenges[rng.randi_range(0, challenges.size() - 1)].duplicate()
	challenge_complete = false
	camera_x = 0.0
	camera_y = 0.0
	shake = 0.0
	flash = 0.0
	slow_motion = 0.0
	particles.clear()
	debris.clear()
	var config := current_vehicle()
	vehicle = {
		"x": 260.0,
		"y": terrain_y(260.0) - 68.0,
		"vx": 0.0,
		"vy": 0.0,
		"angle": -0.13,
		"av": 0.0,
		"width": 170.0 * float(config.length),
		"height": 76.0 * float(config.height),
		"wheel_r": 25.0,
		"config": config,
		"grounded": true,
		"last_angle": -0.13,
		"rotation_total": 0.0,
		"wheel_left": true,
		"wheel_right": true,
		"hard_hits": 0,
		"intact": true
	}
	build_tower()
	update_hud()
	charge_box.visible = true
	tilt_left_button.visible = false
	tilt_right_button.visible = false
	engine_player.stop()
	queue_redraw()

func current_vehicle() -> Dictionary:
	for config in vehicles:
		if str(config.id) == selected_vehicle_id:
			return config
	return vehicles[0]

func build_tower() -> void:
	blocks.clear()
	var start_x := 2050.0
	var ground := terrain_y(start_x)
	for row in range(9):
		var count := 5 if row % 2 == 0 else 4
		for col in range(count):
			var offset := 0.0 if row % 2 == 0 else 45.0
			blocks.append({
				"x": start_x + col * 92.0 + offset,
				"y": ground - 38.0 - row * 72.0,
				"w": 82.0,
				"h": 62.0,
				"vx": 0.0,
				"vy": 0.0,
				"angle": 0.0,
				"av": 0.0,
				"broken": false,
				"hue": float((row * 48 + col * 27) % 360)
			})

func _process(delta: float) -> void:
	time_alive += delta
	menu_bob = sin(time_alive * 2.1) * 12.0
	if music_enabled and not music_player.playing:
		music_player.play()
	if mode == GameMode.PLAYING:
		var game_delta := delta * (0.32 if slow_motion > 0.0 else 1.0)
		if slow_motion > 0.0:
			slow_motion -= delta
		update_game(game_delta)
	queue_redraw()

func _unhandled_input(event: InputEvent) -> void:
	if mode != GameMode.PLAYING:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			begin_charge()
		else:
			release_charge()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			begin_charge()
		else:
			release_charge()
	elif event is InputEventKey:
		if event.keycode == KEY_SPACE:
			if event.pressed and not event.echo:
				begin_charge()
			elif not event.pressed:
				release_charge()
		elif event.pressed and event.keycode == KEY_LEFT:
			tilt_vehicle(-1.0)
		elif event.pressed and event.keycode == KEY_RIGHT:
			tilt_vehicle(1.0)

func begin_charge() -> void:
	if launched:
		return
	charging = true
	if sound_enabled and not engine_player.playing:
		engine_player.pitch_scale = 0.75
		engine_player.play()

func release_charge() -> void:
	if not charging or launched:
		return
	launch_vehicle()

func launch_vehicle() -> void:
	var config: Dictionary = vehicle.config
	var launch_power: float = (0.70 + charge * 0.64) * float(config.power)
	vehicle.vx = 1320.0 * launch_power
	vehicle.vy = -1030.0 * launch_power
	vehicle.av = -0.55
	vehicle.grounded = false
	launched = true
	charging = false
	charge_box.visible = false
	tilt_left_button.visible = true
	tilt_right_button.visible = true
	play_sfx("launch", 0.9 + charge * 0.25, -1.0)
	burst(Vector2(vehicle.x - 50.0, vehicle.y + 20.0), 28, CREAM, 420.0)
	if sound_enabled:
		engine_player.pitch_scale = 1.25

func tilt_vehicle(direction: float) -> void:
	if not launched or vehicle.is_empty():
		return
	vehicle.av += direction * 2.4 * float(vehicle.config.spin)

func update_game(delta: float) -> void:
	if vehicle.is_empty():
		return
	if not launched:
		if charging:
			charge += charge_direction * delta * 0.76
			if charge >= 1.0:
				charge = 1.0
				charge_direction = -1.0
			elif charge <= 0.08:
				charge = 0.08
				charge_direction = 1.0
			if sound_enabled:
				engine_player.pitch_scale = 0.72 + charge * 0.85
		charge_fill.size.x = 606.0 * charge
		return

	run_time += delta
	vehicle.vy += 2050.0 * delta
	vehicle.x += vehicle.vx * delta
	vehicle.y += vehicle.vy * delta
	vehicle.angle += vehicle.av * delta
	vehicle.av *= pow(0.988, delta * 60.0)

	if not vehicle.grounded:
		var turn := shortest_angle(float(vehicle.last_angle), float(vehicle.angle))
		vehicle.rotation_total += turn
		vehicle.last_angle = vehicle.angle
		var counted := floori(abs(float(vehicle.rotation_total)) / TAU)
		if counted > flips:
			flips = counted
			score += 850.0
			burst(Vector2(vehicle.x, vehicle.y), 22, CYAN, 330.0)
			play_sfx("star", 1.0 + flips * 0.04, -5.0)
		score += abs(float(vehicle.av)) * delta * 24.0

	handle_ground(delta)
	update_blocks(delta)
	update_debris(delta)
	update_particles(delta)
	distance_m = max(0.0, (float(vehicle.x) - 260.0) / 8.0)
	score += max(0.0, float(vehicle.vx)) * delta * 0.44
	check_challenge()
	var target_x := max(0.0, float(vehicle.x) - 420.0)
	var target_y := clamp(float(vehicle.y) - 940.0, 0.0, 500.0)
	camera_x = lerp(camera_x, target_x, min(1.0, delta * 4.8))
	camera_y = lerp(camera_y, target_y, min(1.0, delta * 4.0))
	shake *= pow(0.035, delta)
	flash = max(0.0, flash - delta * 2.8)
	var low_motion := abs(float(vehicle.vx)) < 34.0 and abs(float(vehicle.vy)) < 54.0 and bool(vehicle.grounded)
	settle_time = settle_time + delta if low_motion else 0.0
	if run_time > 3.0 and settle_time > 1.35:
		finish_run()
	elif run_time > 15.0 or float(vehicle.x) > 3300.0 or float(vehicle.y) > 2150.0:
		finish_run()
	update_hud()

func handle_ground(delta: float) -> void:
	var ground := terrain_y(float(vehicle.x))
	var bottom := float(vehicle.y) + float(vehicle.height) * 0.42
	if bottom < ground:
		vehicle.grounded = false
		return
	var slope := terrain_slope(float(vehicle.x))
	var impact := abs(float(vehicle.vy)) + abs(float(vehicle.vx) * slope) * 0.55
	vehicle.y = ground - float(vehicle.height) * 0.42
	var target_angle := atan(slope)
	if impact > 420.0:
		vehicle.hard_hits += 1
		shake = min(34.0, impact / 24.0)
		flash = min(0.72, impact / 1700.0)
		score += impact * 2.1 * float(vehicle.config.mass)
		burst(Vector2(vehicle.x, vehicle.y + 18.0), mini(45, roundi(impact / 22.0)), STAR, 540.0)
		var impact_name := "impact%d" % rng.randi_range(1, 3)
		play_sfx(impact_name, rng.randf_range(0.88, 1.06), -1.0)
		Input.vibrate_handheld(clampi(roundi(impact / 16.0), 25, 85))
		if impact > 710.0 and int(vehicle.hard_hits) >= 1:
			break_vehicle_wheel("left" if rng.randf() < 0.5 else "right")
		if impact > 950.0:
			vehicle.intact = false
			slow_motion = max(slow_motion, 0.32)
	vehicle.vy *= -0.23
	vehicle.vx *= max(0.89, 1.0 - delta * 1.5)
	vehicle.av *= 0.70
	vehicle.angle += shortest_angle(float(vehicle.angle), target_angle) * min(1.0, delta * 5.0)
	vehicle.grounded = abs(float(vehicle.vy)) < 58.0
	if bool(vehicle.grounded) and abs(float(vehicle.vx)) < 18.0:
		vehicle.vx *= 0.80
		vehicle.vy = 0.0

func update_blocks(delta: float) -> void:
	for block in blocks:
		if bool(block.broken):
			block.vy += 2050.0 * delta
			block.x += block.vx * delta
			block.y += block.vy * delta
			block.angle += block.av * delta
			var ground := terrain_y(float(block.x)) - float(block.h) * 0.5
			if float(block.y) > ground:
				block.y = ground
				block.vy *= -0.18
				block.vx *= 0.86
				block.av *= 0.8
			continue
		var dx := abs(float(vehicle.x) - float(block.x))
		var dy := abs(float(vehicle.y) - float(block.y))
		if dx < (float(vehicle.width) + float(block.w)) * 0.47 and dy < (float(vehicle.height) + float(block.h)) * 0.54:
			var hit_speed := Vector2(float(vehicle.vx), float(vehicle.vy)).length()
			if hit_speed > 130.0:
				block.broken = true
				block.vx = float(vehicle.vx) * rng.randf_range(0.38, 0.68) + rng.randf_range(-220.0, 220.0)
				block.vy = float(vehicle.vy) * 0.28 - rng.randf_range(260.0, 520.0)
				block.av = rng.randf_range(-8.0, 8.0)
				blocks_broken += 1
				score += 240.0 + hit_speed * 0.66 * float(vehicle.config.mass)
				shake = min(38.0, shake + 7.0)
				flash = max(flash, 0.22)
				burst(Vector2(block.x, block.y), 16, Color.from_hsv(float(block.hue) / 360.0, 0.82, 1.0), 430.0)
				play_sfx("break", rng.randf_range(0.88, 1.16), -7.0)
				vehicle.vx *= 0.965
				vehicle.av += rng.randf_range(-1.0, 1.0)
				if blocks_broken % 8 == 0:
					slow_motion = max(slow_motion, 0.18)

func update_debris(delta: float) -> void:
	for item in debris:
		item.vy += 2050.0 * delta
		item.x += item.vx * delta
		item.y += item.vy * delta
		item.angle += item.av * delta
		var ground := terrain_y(float(item.x)) - float(item.radius)
		if float(item.y) > ground:
			item.y = ground
			item.vy *= -0.32
			item.vx *= 0.84
			item.av *= 0.8

func update_particles(delta: float) -> void:
	for particle in particles:
		particle.life -= delta
		particle.vy += 980.0 * delta
		particle.x += particle.vx * delta
		particle.y += particle.vy * delta
	particles = particles.filter(func(particle): return float(particle.life) > 0.0)

func break_vehicle_wheel(side: String) -> void:
	var key := "wheel_left" if side == "left" else "wheel_right"
	if not bool(vehicle[key]):
		return
	vehicle[key] = false
	debris.append({
		"x": float(vehicle.x) + (-float(vehicle.width) * 0.28 if side == "left" else float(vehicle.width) * 0.28),
		"y": float(vehicle.y),
		"vx": float(vehicle.vx) * 0.55 + rng.randf_range(-180.0, 180.0),
		"vy": float(vehicle.vy) * 0.4 - rng.randf_range(250.0, 430.0),
		"angle": float(vehicle.angle),
		"av": rng.randf_range(-10.0, 10.0),
		"radius": float(vehicle.wheel_r)
	})

func burst(position: Vector2, count: int, color: Color, speed: float) -> void:
	for i in range(count):
		var angle := rng.randf_range(0.0, TAU)
		var magnitude := rng.randf_range(speed * 0.25, speed)
		particles.append({
			"x": position.x,
			"y": position.y,
			"vx": cos(angle) * magnitude,
			"vy": sin(angle) * magnitude - 120.0,
			"life": rng.randf_range(0.45, 1.2),
			"max_life": 1.2,
			"size": rng.randf_range(8.0, 22.0),
			"color": color
		})

func check_challenge() -> void:
	if current_challenge.is_empty():
		return
	match str(current_challenge.type):
		"blocks":
			challenge_complete = blocks_broken >= int(current_challenge.target)
		"flips":
			challenge_complete = flips >= int(current_challenge.target)
		"distance":
			challenge_complete = distance_m >= float(current_challenge.target)
		"score":
			challenge_complete = score >= float(current_challenge.target)

func finish_run() -> void:
	if mode != GameMode.PLAYING:
		return
	mode = GameMode.RESULTS
	check_challenge()
	var destruction_bonus := blocks_broken * 3
	var challenge_bonus := int(current_challenge.bonus) if challenge_complete else 0
	earned_stars = maxi(2, floori(score / 720.0) + destruction_bonus + challenge_bonus)
	stars += earned_stars
	best_score = maxi(best_score, roundi(score))
	save_progress()
	engine_player.stop()
	play_sfx("star", 1.0, -1.0)
	result_title_label.text = "CHALLENGE CRUSHED!" if challenge_complete else "CRASH COMPLETE!"
	result_score_label.text = format_number(roundi(score))
	result_stats_label.text = "DISTANCE   %dm\nFLIPS          %d\nBLOCKS      %d\nSTARS        +%d" % [roundi(distance_m), flips, blocks_broken, earned_stars]
	if challenge_complete:
		result_challenge_label.text = "★ BONUS +%d  •  %s" % [int(current_challenge.bonus), str(current_challenge.text)]
	else:
		result_challenge_label.text = "TRY AGAIN: %s" % str(current_challenge.text)
	hud_panel.visible = false
	results_panel.visible = true

func update_hud() -> void:
	score_label.text = "SCORE\n%s" % format_number(roundi(score))
	best_label.text = "BEST\n%s" % format_number(best_score)
	hud_stars_label.text = "★\n%s" % format_number(stars)
	var prefix := "✓  " if challenge_complete else ""
	var challenge_text := str(current_challenge.text) if not current_challenge.is_empty() else ""
	challenge_label.text = prefix + challenge_text
	challenge_label.add_theme_color_override("font_color", STAR if challenge_complete else CREAM)

func terrain_y(x: float) -> float:
	if x < 360.0:
		return 1250.0
	if x < 720.0:
		return 1250.0 - (x - 360.0) * 0.92
	if x < 1040.0:
		return 919.0 - (x - 720.0) * 0.11
	if x < 1240.0:
		return 884.0 + (x - 1040.0) * 3.05
	if x < 2150.0:
		return 1494.0 + sin((x - 1240.0) * 0.012) * 24.0
	if x < 2850.0:
		return 1494.0 - (x - 2150.0) * 0.23 + sin(x * 0.014) * 20.0
	return 1330.0 + sin(x * 0.011) * 34.0

func terrain_slope(x: float) -> float:
	return (terrain_y(x + 8.0) - terrain_y(x - 8.0)) / 16.0

func shortest_angle(from_angle: float, to_angle: float) -> float:
	return wrapf(to_angle - from_angle, -PI, PI)

func _draw() -> void:
	draw_background()
	if mode == GameMode.MENU or mode == GameMode.GARAGE:
		draw_menu_scene()
	else:
		draw_world()
	if flash > 0.0:
		draw_rect(Rect2(Vector2.ZERO, VIRTUAL_SIZE), Color(1, 1, 1, flash), true)

func draw_background() -> void:
	var bands := 18
	for i in range(bands):
		var blend := float(i) / float(bands - 1)
		var color := SKY_TOP.lerp(SKY_BOTTOM, blend)
		draw_rect(Rect2(0.0, i * VIRTUAL_SIZE.y / bands, VIRTUAL_SIZE.x, VIRTUAL_SIZE.y / bands + 2.0), color)
	for cloud in clouds:
		var cloud_x := float(cloud.x) - camera_x * 0.11
		while cloud_x < -220.0:
			cloud_x += 5700.0
		while cloud_x > 1300.0:
			cloud_x -= 5700.0
		draw_cloud(Vector2(cloud_x, float(cloud.y) - camera_y * 0.05), float(cloud.scale))
	var mountain_points := PackedVector2Array([
		Vector2(-100, 1550), Vector2(90, 1120), Vector2(310, 1420),
		Vector2(520, 1010), Vector2(780, 1430), Vector2(1020, 1090),
		Vector2(1240, 1510), Vector2(1240, 1920), Vector2(-100, 1920)
	])
	for i in range(mountain_points.size()):
		mountain_points[i] = mountain_points[i] - Vector2(camera_x * 0.18, camera_y * 0.08)
	draw_colored_polygon(mountain_points, Color("#80c77c"))

func draw_cloud(pos: Vector2, scale: float) -> void:
	var cloud_color := Color(1, 1, 1, 0.78)
	draw_circle(pos, 46.0 * scale, cloud_color)
	draw_circle(pos + Vector2(52, -16) * scale, 60.0 * scale, cloud_color)
	draw_circle(pos + Vector2(118, 4) * scale, 43.0 * scale, cloud_color)
	draw_rect(Rect2(pos + Vector2(-4, 0) * scale, Vector2(130, 46) * scale), cloud_color)

func draw_menu_scene() -> void:
	var ground := PackedVector2Array([
		Vector2(-80, 1510), Vector2(220, 1400), Vector2(480, 1460),
		Vector2(780, 1350), Vector2(1160, 1510), Vector2(1160, 1920), Vector2(-80, 1920)
	])
	draw_colored_polygon(ground, GRASS)
	draw_polyline(PackedVector2Array([
		Vector2(-80, 1510), Vector2(220, 1400), Vector2(480, 1460),
		Vector2(780, 1350), Vector2(1160, 1510)
	]), GRASS_DARK, 24.0, true)
	var config := current_vehicle()
	draw_set_transform(Vector2(540, 1060 + menu_bob), -0.08 + sin(time_alive * 1.5) * 0.025, Vector2.ONE * 1.28)
	draw_vehicle_art(Vector2.ZERO, config, true, true, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	var streak_color := Color(CYAN.r, CYAN.g, CYAN.b, 0.7)
	for i in range(4):
		var y := 955.0 + i * 58.0
		draw_line(Vector2(90, y), Vector2(270 + i * 42, y), streak_color, 16.0, true)

func draw_world() -> void:
	var shake_offset := Vector2(rng.randf_range(-shake, shake), rng.randf_range(-shake, shake))
	var world_offset := Vector2(-camera_x, -camera_y) + shake_offset
	draw_set_transform(world_offset, 0.0, Vector2.ONE)
	draw_terrain()
	draw_tower(world_offset)
	draw_debris_items(world_offset)
	if not vehicle.is_empty():
		draw_set_transform(world_offset + Vector2(float(vehicle.x), float(vehicle.y)), float(vehicle.angle), Vector2.ONE)
		draw_vehicle_art(Vector2.ZERO, vehicle.config, bool(vehicle.wheel_left), bool(vehicle.wheel_right), bool(vehicle.intact))
		draw_set_transform(world_offset, 0.0, Vector2.ONE)
	draw_particle_items()
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func draw_terrain() -> void:
	var start := floor(camera_x / 30.0) * 30.0 - 90.0
	var finish := camera_x + VIRTUAL_SIZE.x + 160.0
	var points := PackedVector2Array()
	points.append(Vector2(start, terrain_y(start)))
	var x := start
	while x <= finish:
		points.append(Vector2(x, terrain_y(x)))
		x += 24.0
	points.append(Vector2(finish, 2200.0))
	points.append(Vector2(start, 2200.0))
	draw_colored_polygon(points, GRASS)
	var edge := PackedVector2Array()
	x = start
	while x <= finish:
		edge.append(Vector2(x, terrain_y(x)))
		x += 18.0
	draw_polyline(edge, GRASS_DARK, 24.0, true)
	var stripe := PackedVector2Array()
	x = 390.0
	while x < 1030.0:
		stripe.append(Vector2(x, terrain_y(x) - 18.0))
		x += 24.0
	draw_polyline(stripe, CREAM, 10.0, true)

func draw_tower(world_offset: Vector2) -> void:
	for block in blocks:
		draw_set_transform(world_offset + Vector2(float(block.x), float(block.y)), float(block.angle), Vector2.ONE)
		var block_color := Color.from_hsv(float(block.hue) / 360.0, 0.76, 1.0)
		draw_rect(Rect2(-float(block.w) * 0.5, -float(block.h) * 0.5, float(block.w), float(block.h)), block_color, true)
		draw_rect(Rect2(-float(block.w) * 0.5, -float(block.h) * 0.5, float(block.w), float(block.h)), INK, false, 5.0)
		draw_rect(Rect2(-float(block.w) * 0.38, -float(block.h) * 0.34, float(block.w) * 0.76, 10.0), Color(1, 1, 1, 0.25), true)
	draw_set_transform(world_offset, 0.0, Vector2.ONE)

func draw_particle_items() -> void:
	for particle in particles:
		var alpha := clamp(float(particle.life) / float(particle.max_life), 0.0, 1.0)
		var particle_color: Color = particle.color
		particle_color.a = alpha
		draw_circle(Vector2(float(particle.x), float(particle.y)), float(particle.size) * 0.5, particle_color)

func draw_debris_items(world_offset: Vector2) -> void:
	for item in debris:
		draw_set_transform(world_offset + Vector2(float(item.x), float(item.y)), float(item.angle), Vector2.ONE)
		draw_wheel(Vector2.ZERO, float(item.radius))
	draw_set_transform(world_offset, 0.0, Vector2.ONE)

func draw_vehicle_art(pos: Vector2, config: Dictionary, left_wheel: bool, right_wheel: bool, intact: bool) -> void:
	var width := 170.0 * float(config.length)
	var height := 76.0 * float(config.height)
	var wheel_radius := 25.0
	var damage_offset := Vector2(0, 9) if not intact else Vector2.ZERO
	var id := str(config.id)
	var body: Color = config.body
	var accent: Color = config.accent
	var p := pos + damage_offset

	match id:
		"banana":
			var banana := PackedVector2Array([
				p + Vector2(-width * 0.48, height * 0.1), p + Vector2(-width * 0.12, height * 0.42),
				p + Vector2(width * 0.3, height * 0.25), p + Vector2(width * 0.48, -height * 0.12),
				p + Vector2(width * 0.08, height * 0.2), p + Vector2(-width * 0.3, height * 0.18)
			])
			draw_colored_polygon(banana, body)
			draw_polyline(closed_points(banana), INK, 7.0, true)
			draw_eye(p + Vector2(width * 0.28, -height * 0.13), 12.0)
		"dozer":
			draw_rect(Rect2(p + Vector2(-width * 0.39, height * 0.08), Vector2(width * 0.72, height * 0.3)), Color("#343a40"), true)
			draw_rect(Rect2(p + Vector2(-width * 0.25, -height * 0.19), Vector2(width * 0.45, height * 0.34)), body, true)
			draw_rect(Rect2(p + Vector2(-width * 0.25, -height * 0.19), Vector2(width * 0.45, height * 0.34)), INK, false, 7.0)
			draw_rect(Rect2(p + Vector2(-width * 0.08, -height * 0.43), Vector2(width * 0.24, height * 0.24)), accent, true)
			draw_rect(Rect2(p + Vector2(-width * 0.08, -height * 0.43), Vector2(width * 0.24, height * 0.24)), INK, false, 6.0)
			var blade := PackedVector2Array([
				p + Vector2(width * 0.15, -height * 0.27), p + Vector2(width * 0.54, -height * 0.18),
				p + Vector2(width * 0.58, height * 0.33), p + Vector2(width * 0.17, height * 0.27)
			])
			draw_colored_polygon(blade, Color("#cfd4da"))
			draw_polyline(closed_points(blade), INK, 7.0, true)
			draw_eye(p + Vector2(width * 0.03, -height * 0.32), 12.0)
		"excavator":
			draw_rect(Rect2(p + Vector2(-width * 0.38, height * 0.11), Vector2(width * 0.7, height * 0.27)), Color("#343a40"), true)
			draw_rect(Rect2(p + Vector2(-width * 0.22, -height * 0.14), Vector2(width * 0.38, height * 0.3)), body, true)
			draw_rect(Rect2(p + Vector2(-width * 0.22, -height * 0.14), Vector2(width * 0.38, height * 0.3)), INK, false, 7.0)
			draw_rect(Rect2(p + Vector2(-width * 0.02, -height * 0.43), Vector2(width * 0.22, height * 0.24)), accent, true)
			draw_rect(Rect2(p + Vector2(-width * 0.02, -height * 0.43), Vector2(width * 0.22, height * 0.24)), INK, false, 6.0)
			draw_polyline(PackedVector2Array([
				p + Vector2(0.02 * width, -0.06 * height), p + Vector2(0.22 * width, -0.5 * height),
				p + Vector2(0.53 * width, -0.65 * height), p + Vector2(0.63 * width, -0.27 * height)
			]), Color("#555b66"), 15.0, true)
			var bucket := PackedVector2Array([
				p + Vector2(0.54 * width, -0.27 * height), p + Vector2(0.72 * width, -0.08 * height),
				p + Vector2(0.58 * width, 0.1 * height)
			])
			draw_colored_polygon(bucket, Color("#8b929d"))
			draw_polyline(closed_points(bucket), INK, 7.0, true)
			draw_eye(p + Vector2(width * 0.08, -height * 0.33), 12.0)
		"dump":
			draw_rect(Rect2(p + Vector2(-width * 0.5, -height * 0.1), Vector2(width * 0.28, height * 0.36)), body, true)
			draw_rect(Rect2(p + Vector2(-width * 0.5, -height * 0.1), Vector2(width * 0.28, height * 0.36)), INK, false, 7.0)
			draw_rect(Rect2(p + Vector2(-width * 0.44, -height * 0.4), Vector2(width * 0.16, height * 0.25)), accent, true)
			draw_rect(Rect2(p + Vector2(-width * 0.44, -height * 0.4), Vector2(width * 0.16, height * 0.25)), INK, false, 6.0)
			var bed := PackedVector2Array([
				p + Vector2(-width * 0.18, -height * 0.08), p + Vector2(width * 0.44, -height * 0.2),
				p + Vector2(width * 0.47, height * 0.18), p + Vector2(-width * 0.11, height * 0.2)
			])
			draw_colored_polygon(bed, body)
			draw_polyline(closed_points(bed), INK, 7.0, true)
			draw_eye(p + Vector2(-width * 0.31, -height * 0.27), 11.0)
		"supercar", "hypercar":
			var car := PackedVector2Array([
				p + Vector2(-width * 0.49, height * 0.17), p + Vector2(-width * 0.22, -height * 0.2),
				p + Vector2(width * 0.13, -height * 0.31), p + Vector2(width * 0.46, -height * 0.04),
				p + Vector2(width * 0.5, height * 0.14), p + Vector2(width * 0.22, height * 0.23),
				p + Vector2(-width * 0.4, height * 0.25)
			])
			draw_colored_polygon(car, body)
			draw_polyline(closed_points(car), INK, 7.0, true)
			var glass := PackedVector2Array([
				p + Vector2(-width * 0.12, -height * 0.15), p + Vector2(width * 0.13, -height * 0.22),
				p + Vector2(width * 0.29, -height * 0.03), p + Vector2(-width * 0.02, -height * 0.02)
			])
			draw_colored_polygon(glass, accent)
			draw_polyline(closed_points(glass), INK, 5.0, true)
			draw_line(p + Vector2(width * 0.27, -height * 0.27), p + Vector2(width * 0.47, -height * 0.27), accent if id == "hypercar" else INK, 10.0, true)
			draw_eye(p + Vector2(width * 0.22, -height * 0.02), 10.0)
		"semi", "hauler":
			draw_rect(Rect2(p + Vector2(-width * 0.52, -height * 0.16), Vector2(width * 0.28, height * 0.4)), body, true)
			draw_rect(Rect2(p + Vector2(-width * 0.52, -height * 0.16), Vector2(width * 0.28, height * 0.4)), INK, false, 7.0)
			draw_rect(Rect2(p + Vector2(-width * 0.46, -height * 0.43), Vector2(width * 0.18, height * 0.23)), accent, true)
			draw_rect(Rect2(p + Vector2(-width * 0.46, -height * 0.43), Vector2(width * 0.18, height * 0.23)), INK, false, 6.0)
			draw_rect(Rect2(p + Vector2(-width * 0.22, -height * 0.04), Vector2(width * 0.68, height * 0.29)), body, true)
			draw_rect(Rect2(p + Vector2(-width * 0.22, -height * 0.04), Vector2(width * 0.68, height * 0.29)), INK, false, 7.0)
			draw_line(p + Vector2(-width * 0.18, -height * 0.18), p + Vector2(-width * 0.18, -height * 0.5), Color("#555b66"), 10.0, true)
			draw_line(p + Vector2(-width * 0.1, -height * 0.18), p + Vector2(-width * 0.1, -height * 0.5), Color("#555b66"), 10.0, true)
			draw_eye(p + Vector2(-width * 0.35, -height * 0.29), 11.0)
		_:
			draw_rect(Rect2(p - Vector2(width * 0.5, height * 0.5), Vector2(width, height)), body, true)
			draw_rect(Rect2(p - Vector2(width * 0.5, height * 0.5), Vector2(width, height)), INK, false, 7.0)
			var glass_width := width * 0.57 if id == "bus" else width * 0.42
			draw_rect(Rect2(p + Vector2(-width * 0.25, -height * 0.48), Vector2(glass_width, height * 0.33)), accent, true)
			draw_rect(Rect2(p + Vector2(-width * 0.25, -height * 0.48), Vector2(glass_width, height * 0.33)), INK, false, 5.0)
			if id == "rocket":
				var flame := PackedVector2Array([
					p + Vector2(-width * 0.5, -height * 0.2), p + Vector2(-width * 0.76, 0),
					p + Vector2(-width * 0.5, height * 0.2)
				])
				draw_colored_polygon(flame, ORANGE)
				draw_polyline(closed_points(flame), INK, 6.0, true)
			draw_eye(p + Vector2(width * 0.28, -height * 0.08), 11.0)

	if id in ["semi", "hauler"]:
		if left_wheel:
			draw_wheel(p + Vector2(-width * 0.36, height * 0.36), wheel_radius)
		draw_wheel(p + Vector2(-width * 0.04, height * 0.36), wheel_radius * 0.94)
		draw_wheel(p + Vector2(width * 0.18, height * 0.36), wheel_radius * 0.94)
		if right_wheel:
			draw_wheel(p + Vector2(width * 0.39, height * 0.36), wheel_radius * 0.94)
	elif id == "dump":
		if left_wheel:
			draw_wheel(p + Vector2(-width * 0.29, height * 0.42), wheel_radius)
		draw_wheel(p + Vector2(0, height * 0.42), wheel_radius)
		if right_wheel:
			draw_wheel(p + Vector2(width * 0.29, height * 0.42), wheel_radius)
	elif id in ["dozer", "excavator"]:
		if left_wheel:
			draw_wheel(p + Vector2(-width * 0.17, height * 0.27), wheel_radius)
		if right_wheel:
			draw_wheel(p + Vector2(width * 0.16, height * 0.27), wheel_radius)
	elif id in ["supercar", "hypercar"]:
		if left_wheel:
			draw_wheel(p + Vector2(-width * 0.25, height * 0.33), wheel_radius * 0.9)
		if right_wheel:
			draw_wheel(p + Vector2(width * 0.25, height * 0.33), wheel_radius * 0.9)
	else:
		if left_wheel:
			draw_wheel(p + Vector2(-width * 0.28, height * 0.43), wheel_radius)
		if right_wheel:
			draw_wheel(p + Vector2(width * 0.29, height * 0.43), wheel_radius)
		if id == "bus":
			draw_wheel(p + Vector2(0, height * 0.43), wheel_radius * 0.95)

func draw_eye(pos: Vector2, radius: float) -> void:
	draw_circle(pos, radius, CREAM)
	draw_arc(pos, radius, 0.0, TAU, 24, INK, 4.0, true)
	draw_circle(pos + Vector2(radius * 0.32, 0), radius * 0.42, INK)

func draw_wheel(pos: Vector2, radius: float) -> void:
	draw_circle(pos, radius, INK)
	draw_circle(pos, radius * 0.48, Color("#f4f1df"))
	draw_circle(pos, radius * 0.18, Color("#8b91a2"))

func closed_points(points: PackedVector2Array) -> PackedVector2Array:
	var result := points.duplicate()
	if result.size() > 0:
		result.append(result[0])
	return result

func format_number(number: int) -> String:
	var text := str(number)
	var output := ""
	while text.length() > 3:
		output = "," + text.right(3) + output
		text = text.left(text.length() - 3)
	return text + output

func save_progress() -> void:
	var save := ConfigFile.new()
	save.set_value("progress", "selected_vehicle", selected_vehicle_id)
	save.set_value("progress", "unlocked", unlocked)
	save.set_value("progress", "stars", stars)
	save.set_value("progress", "best_score", best_score)
	save.set_value("settings", "sound", sound_enabled)
	save.set_value("settings", "music", music_enabled)
	save.save("user://cliff_crash_crew.cfg")

func load_save() -> void:
	var save := ConfigFile.new()
	if save.load("user://cliff_crash_crew.cfg") != OK:
		return
	selected_vehicle_id = str(save.get_value("progress", "selected_vehicle", "buggy"))
	unlocked = save.get_value("progress", "unlocked", ["buggy"])
	stars = int(save.get_value("progress", "stars", 0))
	best_score = int(save.get_value("progress", "best_score", 0))
	sound_enabled = bool(save.get_value("settings", "sound", true))
	music_enabled = bool(save.get_value("settings", "music", true))
