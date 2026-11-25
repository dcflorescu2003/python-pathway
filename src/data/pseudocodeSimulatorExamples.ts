export const simulatorExamples = [
  { id: "sum", title: "Suma numerelor până la N", input: "5", code: `citeste n
suma <- 0
pentru i <- 1, n executa
  suma <- suma + i
sfarsit pentru
scrie suma` },
  { id: "digits", title: "Suma cifrelor", input: "1234", code: `citeste n
s <- 0
cat timp n > 0 executa
  s <- s + n mod 10
  n <- n div 10
sfarsit cat timp
scrie s` },
  { id: "reverse", title: "Oglinditul unui număr", input: "1234", code: `citeste n
oglindit <- 0
cat timp n > 0 executa
  oglindit <- oglindit * 10 + n mod 10
  n <- n div 10
sfarsit cat timp
scrie oglindit` },
  { id: "gcd", title: "C.M.M.D.C.", input: "48\n18", code: `citeste a, b
cat timp b != 0 executa
  r <- a mod b
  a <- b
  b <- r
sfarsit cat timp
scrie a` },
  { id: "prime", title: "Număr prim", input: "17", code: `citeste n
prim <- n >= 2
d <- 2
cat timp d * d <= n si prim executa
  daca n mod d = 0 atunci
    prim <- fals
  sfarsit daca
  d <- d + 1
sfarsit cat timp
daca prim atunci
  scrie "DA"
altfel
  scrie "NU"
sfarsit daca` },
];