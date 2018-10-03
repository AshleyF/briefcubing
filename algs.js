var Algs = (function () {
    sets = {
        roux_cmll: { name: "Roux CMLL", source: "https://sites.google.com/view/kianroux/cmll", algs: [
            { id: "o_adjacent_swap", name: "O - Adjacent Swap", alg: "R U R' F' R U R' U' R' F R2 U' R'", scramble: "roux" },
            { id: "o_diagonal_swap", name: "O - Diagonal Swap", alg: "r2 D r' U r D' R2 U' F' U' F", scramble: "roux" },
            { id: "h_columns", name: "H - Columns", alg: "R U2 R' U' R U R' U' R U' R'", scramble: "roux" },
            { id: "h_rows", name: "H - Rows", alg: "F R U R' U' R U R' U' R U R' U' F'", scramble: "roux" },
            { id: "h_column", name: "H - Column", alg: "R U2' R2' F R F' U2 R' F R F'", scramble: "roux" },
            { id: "h_row", name: "H - Row", alg: "r U' r2' D' r U' r' D r2 U r'", scramble: "roux" },
            { id: "pi_right_bar", name: "Pi - Right Bar", alg: "F R U R' U' R U R' U' F'", scramble: "roux" },
            { id: "pi_back_slash", name: "Pi - Back Slash", alg: "F R' F' R U2 R U' R' U R U2' R'", scramble: "roux" },
            { id: "pi_x_checkerboard", name: "Pi - X Checkerboard", alg: "R' F R U F U' R U R' U' F'", scramble: "roux" },
            { id: "pi_forward_slash", name: "Pi - Forward Slash", alg: "R U2 R' U' R U R' U2' R' F R F'", scramble: "roux" },
            { id: "pi_columns", name: "Pi - Columns", alg: "r U' r2' D' r U r' D r2 U r'", scramble: "roux" },
            { id: "pi_left_bar", name: "Pi - Left Bar", alg: "R' U' R' F R F' R U' R' U2 R", scramble: "roux" },
            { id: "u_forward_slash", name: "U - Forward Slash", alg: "R2 D R' U2 R D' R' U2 R'", scramble: "roux" },
            { id: "u_back_slash", name: "U - Back Slash", alg: "R2' D' R U2 R' D R U2 R", scramble: "roux" },
            { id: "u_front_row", name: "U - Front Row", alg: "R2' F U' F U F2 R2 U' R' F R", scramble: "roux" },
            { id: "u_rows", name: "U - Rows", alg: "F R2 D R' U R D' R2' U' F'", scramble: "roux" },
            { id: "u_x_checkerboard", name: "U - X Checkerboard", alg: "r U' r' U r' D' r U' r' D r", scramble: "roux" },
            { id: "u_back_row", name: "U - Back Row", alg: "F R U R' U' F'", scramble: "roux" },
            { id: "t_left_bar", name: "T - Left Bar", alg: "R U R' U' R' F R F'", scramble: "roux" },
            { id: "t_right_bar", name: "T - Right Bar", alg: "L' U' L U L F' L' F", scramble: "roux" },
            { id: "t_rows", name: "T - Rows", alg: "F R' F R2 U' R' U' R U R' F2", scramble: "roux" },
            { id: "t_front_row", name: "T - Front Row", alg: "r' U r U2' R2' F R F' R", scramble: "roux" },
            { id: "t_back_row", name: "T - Back Row", alg: "r' D' r U r' D r U' r U r'", scramble: "roux" },
            { id: "t_columns", name: "T - Columns", alg: "r2' D' r U r' D r2 U' r' U' r", scramble: "roux" },
            { id: "s_left_bar", name: "S - Left Bar", alg: "R U R' U R U2 R'", scramble: "roux" },
            { id: "s_x_checkerboard", name: "S - X Checkerboard", alg: "L' U2 L U2' L F' L' F", scramble: "roux" },
            { id: "s_forward_slash", name: "S - Forward Slash", alg: "F R' F' R U2 R U2' R'", scramble: "roux" },
            { id: "s_Columns", name: "S - Columns", alg: "R' U' R U' R2' F' R U R U' R' F U2' R", scramble: "roux" },
            { id: "s_right_bar", name: "S - Right Bar", alg: "R U R' U R' F R F' R U2' R'", scramble: "roux" },
            { id: "s_back_slash", name: "S - Back Slash", alg: "R U' L' U R' U' L", scramble: "roux" },
            { id: "as_right_bar", name: "As - Right Bar", alg: "R' U' R U' R' U2' R", scramble: "roux" },
            { id: "as_columns", name: "As - Columns", alg: "R2 D R' U R D' R' U R' U' R U' R'", scramble: "roux" },
            { id: "as_back_slash", name: "As - Back Slash", alg: "F' L F L' U2' L' U2 L", scramble: "roux" },
            { id: "as_x_checkerboard", name: "As - X Checkerboard", alg: "R U2' R' U2 R' F R F'", scramble: "roux" },
            { id: "as_forward_slash", name: "As - Forward Slash", alg: "L' U R U' L U R'", scramble: "roux" },
            { id: "as_left_bar", name: "As - Left Bar", alg: "R' U' R U' R' U R' F R F' U R", scramble: "roux" },
            { id: "l_mirror", name: "L - Mirror", alg: "F R U' R' U' R U R' F'", scramble: "roux" },
            { id: "l_inverse", name: "L - Inverse", alg: "F R' F' R U R U' R'", scramble: "roux" },
            { id: "l_pure_1", name: "L - Pure 1", alg: "R U2 R' U' R U R' U' R U R' U' R U' R'", scramble: "roux" },
            { id: "l_pure_2", name: "L - Pure 2", alg: "R U R' U R U' R' U R U' R' U R U2 R'", scramble: "roux" },
            { id: "l_front_commutator", name: "L - Front Commutator", alg: "R U2 R D R' U2 R D' R2'", scramble: "roux" },
            { id: "l_diag", name: "L - Diag", alg: "R' U' R U R' F' R U R' U' R' F R2", scramble: "roux" },
            { id: "l_back_commutator", name: "L - Back Commutator", alg: "R' U2 R' D' R U2 R' D R2", scramble: "roux" }]
        }
    }

    return {
        sets: sets
    };
}());