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
  dark_blue: hex_color("#0000ff"),
};

const PATHS = {
  brick_wall: "assets/brick-wall.jpeg",
  basketball: "assets/basketball.png",
  net: "assets/net.png",
  orange: "assets/orange.png", // coloring a phong shader just doesn't hit the same
  backboard: "assets/backboard.png",
};

const RAD_MAX = Math.PI * 2;
const BACKBOARD = {
  omega: RAD_MAX / 5,
  center: Mat4.translation(0, 6, -8.5),
  max: 4,
};

const BALL_LOC = new Vector([0, 260]);
const VERTICAL = new Vector([0, 1]);
const GAME_TIME = 45;

export class TinyBasketball extends Scene {
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
      rim: new defs.Surface_Of_Revolution(
        50,
        50,
        Vector3.cast([0, 1.15, 0.05], [0, 1.15, -0.05])
      ),
      net_0: new defs.Surface_Of_Revolution(
        50,
        50,
        Vector3.cast([0, 0.75, 0.5], [0, 1, -0.5])
      ),
      net: new defs.Surface_Of_Revolution(
        50,
        50,
        Vector3.cast([0, 0.75, 0.5], [0, 1, -0.5])
      ),
      backboard_pole: new defs.Cylindrical_Tube(5, 15),
      side_walls: new defs.Square(),
      timer: new defs.Square(),
      timer_text: new Text_Line(3),
      scoreboard: new defs.Square(),
      scoreboard_text: new Text_Line(3),
      game_start: new defs.Square(),
      game_start_text: new Text_Line(100),
    };

    this.shapes.wall2.arrays.texture_coord = [];
    this.shapes.wall1.arrays.texture_coord.forEach((x, i) => {
      const next = new Vector(this.shapes.wall1.arrays.texture_coord[i]);
      next.scale_by(11);
      this.shapes.wall2.arrays.texture_coord.push(next);
    });

    this.shapes.net.arrays.texture_coord = [];
    this.shapes.net_0.arrays.texture_coord.forEach((x, i) => {
      const next = new Vector(this.shapes.net_0.arrays.texture_coord[i]);
      next.scale_by(1.0 / 50.0);
      this.shapes.net.arrays.texture_coord.push(next);
    });

    // Materials
    this.materials = {
      backboard: new Material(new defs.Textured_Phong(), {
        color: COLORS.black,
        ambient: 1,
        texture: new Texture(PATHS.backboard),
      }),
      rim: new Material(new defs.Textured_Phong(), {
        color: COLORS.black,
        ambient: 1,
        texture: new Texture(PATHS.orange),
      }),
      net: new Material(new defs.Textured_Phong(), {
        color: COLORS.black, // can't decide if white or black looks better
        ambient: 1,
        texture: new Texture(PATHS.net),
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
      ground_texture: new Material(new Reflective_Phong(), {
        color: COLORS.white,
        specular: 1,
        ambient: 0.5,
        diffusivity: 0.5,
      }),
      sides_texture: new Material(new defs.Phong_Shader(), {
        color: COLORS.red,
      }),
      timer: new Material(new defs.Phong_Shader(), {
        color: COLORS.black,
        ambient: 0.8,
      }),
      timer_text_image: new Material(new defs.Textured_Phong(1), {
        ambient: 1,
        texture: new Texture("assets/text.png"),
      }),
      scoreboard: new Material(new defs.Phong_Shader(), {
        color: COLORS.black,
        ambient: 0.9,
      }),
      scoreboard_text_image: new Material(new defs.Textured_Phong(1), {
        ambient: 1,
        texture: new Texture("assets/text.png"),
      }),
      game_start: new Material(new defs.Phong_Shader(), {
        color: COLORS.dark_blue,
        ambient: 0.15,
      }),
      game_start_text_image: new Material(new defs.Textured_Phong(1), {
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
    this.game_ongoing = false;
    // Time left
    this.time_left = GAME_TIME;
    // Score
    this.score = 0;
    this.will_score = false;
    // Ball control
    this.ball_direction = new Vector([0, 0]);
    this.ball_moving = false;
    this.ball_timer = 0;
    this.in_net = false;
    this.net_timer = 0;
    // Object locations
    this.positions = {
      light: vec4(10, 20, 8, 1),
      camera: Mat4.translation(0, 0, -30),
      backboard: 0,
      ball: Mat4.identity()
        .times(Mat4.translation(0, -5, 15))
        .times(Mat4.rotation(Math.PI / 2, 1, 0, 0)),
      ball_origin: Mat4.identity()
        .times(Mat4.translation(0, -5, 15))
        .times(Mat4.rotation(Math.PI / 2, 1, 0, 0)),
    };
    this.once = false;
    this.session_scores = [];
    console.log("sus");
  }

  start_game() {
    if (this.game_ongoing) {
      this.session_scores.push(this.score);
    }
    this.game_ongoing = !this.game_ongoing;
    this.score = 0;
    this.time_left = GAME_TIME;
  }

  make_control_panel() {
    this.key_triggered_button("Start Game", ["q"], () => this.start_game());
    this.key_triggered_button(
      "Pause backboard",
      ["p"],
      () => (this.backboard_move = !this.backboard_move)
    );
  }

  display(context, program_state) {
    // stops game in GAME_TIME seconds until game is restarted
    // sets locations when game is ongoing or stopped
    if (this.time_left <= 0) {
      this.game_ongoing = false;
      this.session_scores.push(this.score);
    }
    if (this.game_ongoing === false) {
      this.ball_moving = false;
      this.positions.backboard = 0;
      this.time_left = GAME_TIME;
    } else {
      this.time_left = this.time_left - this.dt;
    }

    // gets rid of control panel to prevent movement of camera
    /*if (!context.scratchpad.controls) {
      this.children.push(
        (context.scratchpad.controls = new defs.Movement_Controls())
      );
    }*/
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
    // BACKBOARD
    this.draw_backboard(context, program_state); // backboard has to be drawn before background for net texture to work corectly (???)
    // BACKGROUND
    this.draw_background(context, program_state);
    // TIMER AND SCOREBOARD (and game start sign)
    this.make_timer_scoreboard(
      context,
      program_state,
      this.time_left,
      this.score,
      this.game_ongoing
    );
  }

  // Draws and adds timer and scoreboard and start game sign
  make_timer_scoreboard(context, program_state, t, score, ongoing) {
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

    if (ongoing === false) {
      const sign_matrix = Mat4.identity()
        .times(Mat4.translation(0, -0.13, 15))
        .times(Mat4.scale(3.5, 2.7, 1));
      this.shapes.game_start.draw(
        context,
        program_state,
        sign_matrix,
        this.materials.game_start
      );
      let sign_text_matrix = Mat4.identity()
        .times(Mat4.translation(-3.03, 2, 15.1))
        .times(Mat4.scale(0.15, 0.2, 1));

      const text_strings = [
        "To start or stop the game,",
        "press 'q'",
        "To pause the backboard,",
        "press 'p'",
        "You have " + GAME_TIME.toString() + " seconds to score",
        "as many points as possible!",
        "Last game's score: " +
          (this.session_scores.length >= 1
            ? this.session_scores[this.session_scores.length - 1]
            : 0
          ).toString(),
        "Session high score: " +
          (this.session_scores.length >= 1
            ? Math.max(...this.session_scores)
            : 0
          ).toString(),
        "Games played: " + this.session_scores.length.toString(),
      ];

      let i = 0;

      for (let line of text_strings.slice()) {
        i = i + 1;
        this.shapes.game_start_text.set_string(line, context.context);
        this.shapes.game_start_text.draw(
          context,
          program_state,
          sign_text_matrix,
          this.materials.game_start_text_image
        );
        if (i % 2 === 1 || i === 8 /* keep stats together */) {
          sign_text_matrix = sign_text_matrix.times(
            Mat4.translation(0, -2.2, 0)
          );
        } else {
          sign_text_matrix = sign_text_matrix.times(
            Mat4.translation(0, -3.5, 0)
          );
        }
      }
    }

    const time_left = Math.ceil(t);
    const timer_text = time_left.toString();
    this.shapes.timer_text.set_string(timer_text, context.context);
    let timer_text_matrix = Mat4.identity()
      .times(Mat4.translation(9.9, -4.8, 2.1))
      .times(Mat4.scale(2, 2, 1));
    if (timer_text.length === 1) {
      timer_text_matrix = timer_text_matrix.times(Mat4.translation(1.5, 0, 0));
    }
    this.shapes.timer_text.draw(
      context,
      program_state,
      timer_text_matrix,
      this.materials.timer_text_image
    );

    const scoreboard_text = score.toString();
    this.shapes.scoreboard_text.set_string(scoreboard_text, context.context);
    let scoreboard_text_matrix = Mat4.identity()
      .times(Mat4.translation(-9.9, -4.8, 2.1))
      .times(Mat4.scale(2, 2, 1));
    if (scoreboard_text.length > 1) {
      scoreboard_text_matrix = scoreboard_text_matrix.times(
        Mat4.translation(-1.5, 0, 0)
      );
    }
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

    const half_g = 30.0; // correct physics on a planet with ~(2 * half_g / 9.8)x gravity of Earth
    const tth = 0.8; // ball reaches y,z-values of hoop in tth second
    const ttl = 1.25; // ball disappears after ttl seconds; falls straight down either as a result of hitting wall or scoring in hoop

    const throw_angle = Math.atan(
      this.ball_direction[0] / this.ball_direction[1]
    );

    if (this.ball_moving) {
      if (this.will_score) {
        this.in_net = true;
      }
      if (this.ball_timer >= ttl) {
        this.ball_moving = false;
        this.ball_timer = 0;
        if (this.will_score) {
          this.score += 1;
        }
        this.will_score = false;
        this.in_net = false;
        this.net_timer = 0;
      } else {
        // irl distances
        //    from floor to rim:                        3m
        //    from three-point line to center of hoop:  7.24m
        //    ball diameter:                            0.24m
        //    hoop diameter:                            0.46m

        const rim_offset = 2.0;
        const rim_y = this.positions.rim[1][3];
        const rim_z = this.positions.rim[2][3];
        const dy = rim_y - -5 + rim_offset; // distance from floor to rim; + rim_offset since we aim above the rim
        const dz = 15 - rim_z; // distance from ball on three-point line to center of hoop
        const dx = -dz * (this.ball_direction[0] / this.ball_direction[1]); // distance from yz-plane; dz * tan(throw_angle)
        const dd = dz / Math.cos(throw_angle); // diagonal distance to hoop

        let v_z = dd / tth;
        let v_y = (dy + half_g * tth ** 2) / tth;

        let r_z = v_z * this.ball_timer;
        let r_y = v_y * this.ball_timer - half_g * this.ball_timer ** 2;

        // figure out arc in yz-plane
        // then rotate to appropriate angle
        if (r_z < dd) {
          this.positions.ball = Mat4.translation(0, -5, 15)
            .times(Mat4.rotation(throw_angle, 0, 1, 0))
            .times(Mat4.translation(0, r_y, -r_z))
            .times(Mat4.translation(0, 5, -15))
            .times(this.positions.ball_origin);
          this.last = {
            z: r_z,
          };
        } else {
          if (
            Math.abs(this.positions.ball[1][3] - this.positions.net[1][3]) < 0.2
          ) {
            this.will_score =
              Math.abs(this.positions.ball[0][3] - this.positions.net[0][3]) <
              1.6;
          }
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
      this.materials.backboard
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
    // HOOP/RIM/NET
    this.positions.rim = backboard_location
      .times(Mat4.scale(0.4, 1.1, 0.5))
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
      .times(Mat4.translation(0, 1.15, 0.59));

    this.shapes.rim.draw(
      context,
      program_state,
      this.positions.rim,
      this.materials.rim
    );

    let net_shear = 0.1 * Math.sin((2 * Math.PI * this.t) / 3);

    if (this.in_net && this.net_timer <= 0.3) {
      net_shear =
        0.15 * // scale shear
        this.positions.net[0][3] * // shear proportional to x-coordinate of hoop (including sign)
        Math.sin((2 * Math.PI * this.net_timer) / 3);
      this.net_timer += this.dt;
    }

    this.positions.net = backboard_location
      .times(Mat4.scale(0.4, 1.1, 0.5))
      .times(Mat4.translation(0, -0.56, 1.15))
      .times(Mat4.rotation(Math.PI / 4, 0, 1, 0)) // rotate so shear is in xz-plane
      .times(
        this.backboard_move && this.game_ongoing
          ? // prettier-ignore
            Matrix.of(
          [1, net_shear, 0, 0], 
          [0,         1, 0, 0], 
          [0, net_shear, 1, 0], 
          [0,         0, 0, 1])
          : Mat4.identity()
      )
      .times(Mat4.translation(0, -0.5, 0)) // bring top center to origin
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));

    this.shapes.net.draw(
      context,
      program_state,
      this.positions.net,
      this.materials.net
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
      this.ball_direction = vecFrom;
      if (Math.abs(this.ball_direction[0]) > 0.6) {
        const xSign = this.ball_direction[0] < 0 ? -1 : 1;
        const ySign = this.ball_direction[1] < 0 ? -1 : 1;
        this.ball_direction[0] = 0.6 * xSign;
        this.ball_direction[1] = 0.8 * ySign;
      }
      // console.log(this.ball_direction);
      this.ball_moving = true;
    }
  }
}

class Reflective_Phong extends defs.Textured_Phong {
  fragment_glsl_code() {
    return (
      this.shared_glsl_code() +
      `
          varying vec2 f_tex_coord;
          uniform sampler2D texture;
          uniform float animation_time;
          void main(){
              // Sample the texture image in the correct place:
              vec4 tex_color = texture2D( texture, f_tex_coord );
              if( tex_color.w < .01 ) discard;
                                                                       // Compute an initial (ambient) color:
              gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                       // Compute the final color with contributions from lights:
              gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
      } `
    );
  }
}
