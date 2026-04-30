/**
 * A spec with many models referencing each other in a circular manner which caused a stack overflow.
 * Regression test for https://github.com/microsoft/typespec/issues/9603
 */
model Model1 {
  id: int32;
  ref1: Model2;
  ref2: Model3;
  ref3: Model4;
  ref4: Model5;
  ref5: Model6;
  ref6: Model7;
  ref7: Model8;
  ref8: Model9;
  ref9: Model10;
  ref10: Model11;
  ref11: Model12;
  ref12: Model13;
  ref13: Model14;
  ref14: Model15;
  ref15: Model16;
  ref16: Model17;
  ref17: Model18;
  ref18: Model19;
  ref19: Model1;
  ref20: Model2;
  ref21: Model3;
  ref22: Model4;
  ref23: Model5;
  ref24: Model6;
}

model Model2 {
  id: int32;
  ref1: Model3;
  ref2: Model4;
  ref3: Model5;
  ref4: Model6;
  ref5: Model7;
  ref6: Model8;
  ref7: Model9;
  ref8: Model10;
  ref9: Model11;
  ref10: Model12;
  ref11: Model13;
  ref12: Model14;
  ref13: Model15;
  ref14: Model16;
  ref15: Model17;
  ref16: Model18;
  ref17: Model19;
  ref18: Model1;
  ref19: Model2;
  ref20: Model3;
  ref21: Model4;
  ref22: Model5;
  ref23: Model6;
  ref24: Model7;
}

model Model3 {
  id: int32;
  ref1: Model4;
  ref2: Model5;
  ref3: Model6;
  ref4: Model7;
  ref5: Model8;
  ref6: Model9;
  ref7: Model10;
  ref8: Model11;
  ref9: Model12;
  ref10: Model13;
  ref11: Model14;
  ref12: Model15;
  ref13: Model16;
  ref14: Model17;
  ref15: Model18;
  ref16: Model19;
  ref17: Model1;
  ref18: Model2;
  ref19: Model3;
  ref20: Model4;
  ref21: Model5;
  ref22: Model6;
  ref23: Model7;
  ref24: Model8;
}

model Model4 {
  id: int32;
  ref1: Model5;
  ref2: Model6;
  ref3: Model7;
  ref4: Model8;
  ref5: Model9;
  ref6: Model10;
  ref7: Model11;
  ref8: Model12;
  ref9: Model13;
  ref10: Model14;
  ref11: Model15;
  ref12: Model16;
  ref13: Model17;
  ref14: Model18;
  ref15: Model19;
  ref16: Model1;
  ref17: Model2;
  ref18: Model3;
  ref19: Model4;
  ref20: Model5;
  ref21: Model6;
  ref22: Model7;
  ref23: Model8;
  ref24: Model9;
}

model Model5 {
  id: int32;
  ref1: Model6;
  ref2: Model7;
  ref3: Model8;
  ref4: Model9;
  ref5: Model10;
  ref6: Model11;
  ref7: Model12;
  ref8: Model13;
  ref9: Model14;
  ref10: Model15;
  ref11: Model16;
  ref12: Model17;
  ref13: Model18;
  ref14: Model19;
  ref15: Model1;
  ref16: Model2;
  ref17: Model3;
  ref18: Model4;
  ref19: Model5;
  ref20: Model6;
  ref21: Model7;
  ref22: Model8;
  ref23: Model9;
  ref24: Model10;
}

model Model6 {
  id: int32;
  ref1: Model7;
  ref2: Model8;
  ref3: Model9;
  ref4: Model10;
  ref5: Model11;
  ref6: Model12;
  ref7: Model13;
  ref8: Model14;
  ref9: Model15;
  ref10: Model16;
  ref11: Model17;
  ref12: Model18;
  ref13: Model19;
  ref14: Model1;
  ref15: Model2;
  ref16: Model3;
  ref17: Model4;
  ref18: Model5;
  ref19: Model6;
  ref20: Model7;
  ref21: Model8;
  ref22: Model9;
  ref23: Model10;
  ref24: Model11;
}

model Model7 {
  id: int32;
  ref1: Model8;
  ref2: Model9;
  ref3: Model10;
  ref4: Model11;
  ref5: Model12;
  ref6: Model13;
  ref7: Model14;
  ref8: Model15;
  ref9: Model16;
  ref10: Model17;
  ref11: Model18;
  ref12: Model19;
  ref13: Model1;
  ref14: Model2;
  ref15: Model3;
  ref16: Model4;
  ref17: Model5;
  ref18: Model6;
  ref19: Model7;
  ref20: Model8;
  ref21: Model9;
  ref22: Model10;
  ref23: Model11;
  ref24: Model12;
}

model Model8 {
  id: int32;
  ref1: Model9;
  ref2: Model10;
  ref3: Model11;
  ref4: Model12;
  ref5: Model13;
  ref6: Model14;
  ref7: Model15;
  ref8: Model16;
  ref9: Model17;
  ref10: Model18;
  ref11: Model19;
  ref12: Model1;
  ref13: Model2;
  ref14: Model3;
  ref15: Model4;
  ref16: Model5;
  ref17: Model6;
  ref18: Model7;
  ref19: Model8;
  ref20: Model9;
  ref21: Model10;
  ref22: Model11;
  ref23: Model12;
  ref24: Model13;
}

model Model9 {
  id: int32;
  ref1: Model10;
  ref2: Model11;
  ref3: Model12;
  ref4: Model13;
  ref5: Model14;
  ref6: Model15;
  ref7: Model16;
  ref8: Model17;
  ref9: Model18;
  ref10: Model19;
  ref11: Model1;
  ref12: Model2;
  ref13: Model3;
  ref14: Model4;
  ref15: Model5;
  ref16: Model6;
  ref17: Model7;
  ref18: Model8;
  ref19: Model9;
  ref20: Model10;
  ref21: Model11;
  ref22: Model12;
  ref23: Model13;
  ref24: Model14;
}

model Model10 {
  id: int32;
  ref1: Model11;
  ref2: Model12;
  ref3: Model13;
  ref4: Model14;
  ref5: Model15;
  ref6: Model16;
  ref7: Model17;
  ref8: Model18;
  ref9: Model19;
  ref10: Model1;
  ref11: Model2;
  ref12: Model3;
  ref13: Model4;
  ref14: Model5;
  ref15: Model6;
  ref16: Model7;
  ref17: Model8;
  ref18: Model9;
  ref19: Model10;
  ref20: Model11;
  ref21: Model12;
  ref22: Model13;
  ref23: Model14;
  ref24: Model15;
}

model Model11 {
  id: int32;
  ref1: Model12;
  ref2: Model13;
  ref3: Model14;
  ref4: Model15;
  ref5: Model16;
  ref6: Model17;
  ref7: Model18;
  ref8: Model19;
  ref9: Model1;
  ref10: Model2;
  ref11: Model3;
  ref12: Model4;
  ref13: Model5;
  ref14: Model6;
  ref15: Model7;
  ref16: Model8;
  ref17: Model9;
  ref18: Model10;
  ref19: Model11;
  ref20: Model12;
  ref21: Model13;
  ref22: Model14;
  ref23: Model15;
  ref24: Model16;
}

model Model12 {
  id: int32;
  ref1: Model13;
  ref2: Model14;
  ref3: Model15;
  ref4: Model16;
  ref5: Model17;
  ref6: Model18;
  ref7: Model19;
  ref8: Model1;
  ref9: Model2;
  ref10: Model3;
  ref11: Model4;
  ref12: Model5;
  ref13: Model6;
  ref14: Model7;
  ref15: Model8;
  ref16: Model9;
  ref17: Model10;
  ref18: Model11;
  ref19: Model12;
  ref20: Model13;
  ref21: Model14;
  ref22: Model15;
  ref23: Model16;
  ref24: Model17;
}

model Model13 {
  id: int32;
  ref1: Model14;
  ref2: Model15;
  ref3: Model16;
  ref4: Model17;
  ref5: Model18;
  ref6: Model19;
  ref7: Model1;
  ref8: Model2;
  ref9: Model3;
  ref10: Model4;
  ref11: Model5;
  ref12: Model6;
  ref13: Model7;
  ref14: Model8;
  ref15: Model9;
  ref16: Model10;
  ref17: Model11;
  ref18: Model12;
  ref19: Model13;
  ref20: Model14;
  ref21: Model15;
  ref22: Model16;
  ref23: Model17;
  ref24: Model18;
}

model Model14 {
  id: int32;
  ref1: Model15;
  ref2: Model16;
  ref3: Model17;
  ref4: Model18;
  ref5: Model19;
  ref6: Model1;
  ref7: Model2;
  ref8: Model3;
  ref9: Model4;
  ref10: Model5;
  ref11: Model6;
  ref12: Model7;
  ref13: Model8;
  ref14: Model9;
  ref15: Model10;
  ref16: Model11;
  ref17: Model12;
  ref18: Model13;
  ref19: Model14;
  ref20: Model15;
  ref21: Model16;
  ref22: Model17;
  ref23: Model18;
  ref24: Model19;
}

model Model15 {
  id: int32;
  ref1: Model16;
  ref2: Model17;
  ref3: Model18;
  ref4: Model19;
  ref5: Model1;
  ref6: Model2;
  ref7: Model3;
  ref8: Model4;
  ref9: Model5;
  ref10: Model6;
  ref11: Model7;
  ref12: Model8;
  ref13: Model9;
  ref14: Model10;
  ref15: Model11;
  ref16: Model12;
  ref17: Model13;
  ref18: Model14;
  ref19: Model15;
  ref20: Model16;
  ref21: Model17;
  ref22: Model18;
  ref23: Model19;
  ref24: Model1;
}

model Model16 {
  id: int32;
  ref1: Model17;
  ref2: Model18;
  ref3: Model19;
  ref4: Model1;
  ref5: Model2;
  ref6: Model3;
  ref7: Model4;
  ref8: Model5;
  ref9: Model6;
  ref10: Model7;
  ref11: Model8;
  ref12: Model9;
  ref13: Model10;
  ref14: Model11;
  ref15: Model12;
  ref16: Model13;
  ref17: Model14;
  ref18: Model15;
  ref19: Model16;
  ref20: Model17;
  ref21: Model18;
  ref22: Model19;
  ref23: Model1;
  ref24: Model2;
}

model Model17 {
  id: int32;
  ref1: Model18;
  ref2: Model19;
  ref3: Model1;
  ref4: Model2;
  ref5: Model3;
  ref6: Model4;
  ref7: Model5;
  ref8: Model6;
  ref9: Model7;
  ref10: Model8;
  ref11: Model9;
  ref12: Model10;
  ref13: Model11;
  ref14: Model12;
  ref15: Model13;
  ref16: Model14;
  ref17: Model15;
  ref18: Model16;
  ref19: Model17;
  ref20: Model18;
  ref21: Model19;
  ref22: Model1;
  ref23: Model2;
  ref24: Model3;
}

model Model18 {
  id: int32;
  ref1: Model19;
  ref2: Model1;
  ref3: Model2;
  ref4: Model3;
  ref5: Model4;
  ref6: Model5;
  ref7: Model6;
  ref8: Model7;
  ref9: Model8;
  ref10: Model9;
  ref11: Model10;
  ref12: Model11;
  ref13: Model12;
  ref14: Model13;
  ref15: Model14;
  ref16: Model15;
  ref17: Model16;
  ref18: Model17;
  ref19: Model18;
  ref20: Model19;
  ref21: Model1;
  ref22: Model2;
  ref23: Model3;
  ref24: Model4;
}

model Model19 {
  id: int32;
  ref1: Model1;
  ref2: Model2;
  ref3: Model3;
  ref4: Model4;
  ref5: Model5;
  ref6: Model6;
  ref7: Model7;
  ref8: Model8;
  ref9: Model9;
  ref10: Model10;
  ref11: Model11;
  ref12: Model12;
  ref13: Model13;
  ref14: Model14;
  ref15: Model15;
  ref16: Model16;
  ref17: Model17;
  ref18: Model18;
  ref19: Model19;
  ref20: Model1;
  ref21: Model2;
  ref22: Model3;
  ref23: Model4;
  ref24: Model5;
}
