import { defs, tiny } from "./examples/common.js";

import { Text_Line } from "./examples/text-demo.js";

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
  Texture,
} = tiny;

const COLORS = {
  black: hex_color("#000000"),
  white: hex_color("#ffffff"),
  red: hex_color("#ff0000"),
  silver: hex_color("#bcbcbc"),
  yellow: hex_color("#ffff00"),
};

const PATHS = {
  brick_wall: "assets/brick-wall.jpeg",
  basketball: "assets/basketball.png",
};

const RAD_MAX = Math.PI * 2;
const BACKBOARD = {
  omega: RAD_MAX / 5,
  center: Mat4.translation(0, 6, -8.5),
  max: 4,
};

const BALL_LOC = new Vector([0, 260]);
const VERTICAL = new Vector([0, 1]);
const BALL_VELOCITY = 5;
const G = 9.8*3;
const GAME_TIME = 45;

export class TinyBasketball extends Scene {
  /**
   *  **Base_scene** is a Scene that can be added to any display canvas.
   *  Setup the shapes, materials, camera, and lighting here.
   */
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();

    // Shapes
    this.shapes = {
      basketball: new defs.Subdivision_Sphere(5),
      ground: new defs.Square(),
      wall1: new defs.Square(),
      wall2: new defs.Square(),
      backboard: new defs.Square(),
      backboard_hoop: new defs.Cylindrical_Tube(3, 15),
      backboard_pole: new defs.Cylindrical_Tube(5, 15),
      side_walls: new defs.Square(),
      timer: new defs.Square(),
      timer_text: new Text_Line(3),
      scoreboard: new defs.Square(),
      scoreboard_text: new Text_Line(3),
    };

    this.shapes.wall2.arrays.texture_coord = [];
    this.shapes.wall1.arrays.texture_coord.forEach((x, i) => {
      const next = new Vector(this.shapes.wall1.arrays.texture_coord[i]);
      next.scale_by(11);
      this.shapes.wall2.arrays.texture_coord.push(next);
    });

    // Materials
    this.materials = {
      phong: new Material(new defs.Textured_Phong(), {
        color: COLORS.white,
      }),
      basketball: new Material(new defs.Textured_Phong(), {
        color: COLORS.black,
        ambient: 1,
        texture: new Texture(PATHS.basketball),
      }),
      pole: new Material(new defs.Textured_Phong(), {
        color: COLORS.silver,
        specular: 1,
        ambient: 0.2,
        diffusivity: 1,
      }),
      wall_texture: new Material(new defs.Textured_Phong(), {
        color: COLORS.black,
        ambient: 1,
        texture: new Texture(PATHS.brick_wall),
      }),
      ground_texture: new Material(new defs.Textured_Phong(), {
        color: COLORS.white,
        // specular: 1,
        ambient: 0.5,
        diffusivity: 0.5,
      }),
      sides_texture: new Material(new defs.Textured_Phong(), {
        color: COLORS.red,
      }),
      timer: new Material(new defs.Textured_Phong(), {
        color: COLORS.yellow,
        ambient: 0.8,
      }),
      timer_text_image: new Material(new defs.Textured_Phong(1), {
        ambient: 1,
        texture: new Texture("assets/text.png"),
      }),
      scoreboard: new Material(new defs.Textured_Phong(), {
        color: COLORS.yellow,
        ambient: 0.9,
      }),
      scoreboard_text_image: new Material(new defs.Textured_Phong(1), {
        ambient: 1,
        texture: new Texture("assets/text.png"),
      }),
    };

    /* Other Scene Variables */
    // Camera Direction and Location
    this.initial_camera_location = Mat4.look_at(
      vec3(0, 10, 20),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );
    // dt
    this.dt = 0;
    // Backboard move flag
    this.backboard_move = true;
    // Restart Game flag
    this.restart_game = false;
    // Score
    this.score = 0;
    this.will_score = true;
    // Ball control
    this.ball_direction = new Vector([0, 0]);
    this.ball_moving = false;
    this.ball_timer = 0;
    // Object locations
    this.positions = {
      light: vec4(10, 20, 8, 1),
      camera: Mat4.translation(0, 0, -30),
      backboard: 0,
      ball: Mat4.identity()
        .times(Mat4.translation(0, -5, 15))
        .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
        .times(Mat4.scale(0.565, 0.565, 0.565)),
      ball_origin: Mat4.identity()
        .times(Mat4.translation(0, -5, 15))
        .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
        .times(Mat4.scale(0.565, 0.565, 0.565)),
    };
    this.once = false;
    console.log("Sus");
  }

  make_control_panel() {
    this.key_triggered_button(
      "Pause backboard",
      ["p"],
      () => (this.backboard_move = !this.backboard_move)
    );
    this.key_triggered_button(
      "Restart Game",
      ["q"],
      () => (this.restart_game = true)
    );
  }

  display(context, program_state) {
    // gets rid of control panel to prevent movement of camera
    if (!context.scratchpad.controls) {
      this.children.push(
        (context.scratchpad.controls = new defs.Movement_Controls())
      );
    }
    if (this.once === false) {
      document.addEventListener("mouseup", (e) =>
        this.get_throw_angle(e, context)
      );
      this.once = true;
    }
    // this.mouse = {"from_center": vec(0, 0)};
    // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:

    program_state.set_camera(this.positions.camera);

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      1,
      100
    );

    program_state.lights = [
      new Light(this.positions.light, color(1, 1, 1, 1), 1000),
    ];

    this.t = program_state.animation_time / 1000;
    this.dt = program_state.animation_delta_time / 1000;

    // BASKETBALL
    this.draw_basketball(context, program_state);
    // BACKGROUND
    this.draw_background(context, program_state);
    // BACKBOARD
    this.draw_backboard(context, program_state);
    // TIMER AND SCOREBOARD
    this.make_timer_scoreboard(context, program_state, this.t, this.score);
  }

  // Draws and adds timer and scoreboard
  make_timer_scoreboard(context, program_state, t, score) {
    const timer_matrix = Mat4.identity()
      .times(Mat4.translation(11.5, -4.5, 2))
      .times(Mat4.scale(4, 2, 1));
    const scoreboard_matrix = Mat4.identity()
      .times(Mat4.translation(-11.5, -4.5, 2))
      .times(Mat4.scale(4, 2, 1));

    this.shapes.timer.draw(
      context,
      program_state,
      timer_matrix,
      this.materials.timer
    );
    this.shapes.scoreboard.draw(
      context,
      program_state,
      scoreboard_matrix,
      this.materials.scoreboard
    );

    const time_left = Math.ceil(GAME_TIME - t);
    const timer_text = time_left.toString();
    this.shapes.timer_text.set_string(timer_text, context.context);
    const timer_text_matrix = Mat4.identity()
      .times(Mat4.translation(9.9, -4.8, 2.1))
      .times(Mat4.scale(2, 2, 1));
    this.shapes.timer_text.draw(
      context,
      program_state,
      timer_text_matrix,
      this.materials.timer_text_image
    );

    const scoreboard_text = score.toString();
    this.shapes.scoreboard_text.set_string(scoreboard_text, context.context);
    const scoreboard_text_matrix = Mat4.identity()
      .times(Mat4.translation(-9.9, -4.8, 2.1))
      .times(Mat4.scale(2, 2, 1));
    this.shapes.scoreboard_text.draw(
      context,
      program_state,
      scoreboard_text_matrix,
      this.materials.scoreboard_text_image
    );
  }

  // Draws basketball
  draw_basketball(context, program_state) {
    // BALL

    const half_g = 20; // correct physics on a planet with 4x gravity of Earth
    const tth = 1.0; // ball reaches y,z-values of hoop in 1 second
    const ttl = 1.5; // ball disappears after 1.5 seconds, either continuing on arc trajectory or falling straight down (when scored)

    const throw_angle = Math.atan(
      this.ball_direction[0] / this.ball_direction[1]
    );

    if (this.ball_moving) {
      if (this.ball_timer >= ttl) {
        this.ball_moving = false;
        this.ball_timer = 0;
        if (this.will_score) {
            this.score += 1;
        }
      } else {
        // irl distances
        //    from floor to rim:                        3m
        //    from three-point line to center of hoop:  7.24m
        //    ball diameter:                            0.24m
        //    hoop diameter:                            0.46m

        const dy = 9.125 - -5 + 1; // distance from floor to rim
        const dz = 15 - -4.6; // distance from ball on three-point line to center of hoop
        const dx = -dz * (this.ball_direction[0] / this.ball_direction[1]); // distance from y-z plane; dz * tan(throw_angle)
        const dd = dz / Math.cos(throw_angle); // diagonal distance to hoop

        let v_z = dd / tth;
        let v_y = (dy + half_g * tth ** 2) / tth;

        let r_z = v_z * this.ball_timer;
        let r_y = v_y * this.ball_timer - half_g * this.ball_timer ** 2;

        // figure out arc in y-z plane
        // then rotate to appropriate angle
        if (r_z < dd) {
          this.positions.ball = Mat4.translation(0, -5, 15)
            .times(Mat4.rotation(throw_angle, 0, 1, 0))
            .times(Mat4.translation(0, r_y, -r_z))
            .times(Mat4.translation(0, 5, -15))
            .times(this.positions.ball_origin);
            this.last = {
                z: r_z
            }
            this.will_score = Math.abs(this.positions.ball[0][3] - this.positions.hoop[0][3]) + this.dt * BACKBOARD.omega < 1.5;
            console.log("Ball: ", this.positions.ball[0][3])
            console.log("Ball: ", this.positions.hoop[0][3])
        } else {
            this.positions.ball = Mat4.translation(0, -5, 15)
            .times(Mat4.rotation(throw_angle, 0, 1, 0))
            .times(Mat4.translation(0, r_y, -this.last.z))
            .times(Mat4.translation(0, 5, -15))
            .times(this.positions.ball_origin);
            this.last.y -= half_g * this.dt;
        }

        this.ball_timer += this.dt;
      }
    } else {
      this.positions.ball = this.positions.ball_origin;
    }

    this.shapes.basketball.draw(
      context,
      program_state,
      this.positions.ball,
      this.materials.basketball
    );
  }

  // Draws background
  draw_background(context, program_state) {
    // WALL
    let wall_transform = Mat4.identity()
      .times(Mat4.translation(0, 4, -10))
      .times(Mat4.scale(23, 14, 0.1));
    this.shapes.wall2.draw(
      context,
      program_state,
      wall_transform,
      this.materials.wall_texture
    );

    // GROUND
    let ground_transform = Mat4.identity();
    ground_transform = ground_transform
      .times(Mat4.translation(0, -10, 0))
      .times(Mat4.scale(23, 1, 14))
      .times(Mat4.rotation((3 * Math.PI) / 2, 1, 0, 0));
    this.shapes.ground.draw(
      context,
      program_state,
      ground_transform,
      this.materials.ground_texture
    );

    // SIDES
    let sides_transform = Mat4.identity();
    sides_transform = sides_transform
      .times(Mat4.translation(23, 4, 0))
      .times(Mat4.scale(1, 14, 14))
      .times(Mat4.rotation((3 * Math.PI) / 2, 0, 1, 0));
    this.shapes.side_walls.draw(
      context,
      program_state,
      sides_transform,
      this.materials.sides_texture
    );
    sides_transform = Mat4.identity();
    sides_transform = sides_transform
      .times(Mat4.translation(-23, 4, 0))
      .times(Mat4.scale(1, 14, 14))
      .times(Mat4.rotation(Math.PI / 2, 0, 1, 0));
    this.shapes.side_walls.draw(
      context,
      program_state,
      sides_transform,
      this.materials.sides_texture
    );
  }

  // Draws backboard
  draw_backboard(context, program_state) {
    // BACKBOARD
    if (this.backboard_move) {
      if (Math.abs(this.positions.backboard) > BACKBOARD.max) {
        if (this.positions.backboard > 0) {
          this.positions.backboard = BACKBOARD.max;
        } else {
          this.positions.backboard = -BACKBOARD.max;
        }
        BACKBOARD.omega = -BACKBOARD.omega;
      }
      this.positions.backboard += this.dt * BACKBOARD.omega;
    }

    const backboard_location = Mat4.identity()
      .times(BACKBOARD.center)
      .times(Mat4.scale(3.75, 2.5, 3))
      .times(Mat4.translation(this.positions.backboard, 2, 0.8));
    this.shapes.backboard.draw(
      context,
      program_state,
      backboard_location,
      this.materials.phong
    );
    // HOOP/NET
    this.positions.hoop = backboard_location
      .times(Mat4.scale(0.4, 0.5, 0.5))
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
      .times(Mat4.translation(0, 1, 1.5));
    this.shapes.backboard_hoop.draw(
      context,
      program_state,
      this.positions.hoop,
      this.materials.phong.override({ color: COLORS.red })
    );
    // SLIDE POLE
    const pole_location = Mat4.identity()
      .times(BACKBOARD.center)
      .times(Mat4.scale(30, 0.5, 1))
      .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
      .times(Mat4.translation(-0.5, 8, 0));
    this.shapes.backboard_pole.draw(
      context,
      program_state,
      pole_location,
      this.materials.pole
    );
  }

  get_throw_angle(e, context) {
    // don't update ball_direction while ball is in motion
    if (!this.ball_moving) {
      const rect = context.canvas.getBoundingClientRect();
      const mouse_position = vec(
        e.clientX - (rect.left + rect.right) / 2,
        e.clientY - (rect.bottom + rect.top) / 2
      );
      const vecFrom = BALL_LOC.minus(mouse_position);
      vecFrom.normalize();
      // Math.asin(vecFrom.dot(VERTICAL));
      // console.log("Normalized vector from", vecFrom);
      // console.log("Angle from vertical", this.ball_direction);
      this.ball_direction = vecFrom;
    //   console.log(this.ball_direction);
      this.ball_moving = true;
    }
  }
}
