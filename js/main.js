var select = document.getElementById("years_select");
for(var i=1;i<=30;i++){
  var opt = document.createElement("option");
  opt.value=i;
  opt.innerHTML=i+"年"+i*12+"期";
  select.appendChild(opt);
}


// 价钱单位
Vue.filter('yuan',function (val,unit) {
  if(unit == 'wan'){
    return val + '万元'
  }else {
    return val + '元'
  }
})

// 房贷计算
var calculter = new Vue({
  el: '#calculter',
  data: {
    housePrice: 150,
    downpayPct: 30,
    fundLoanCount: 60,
    fundLoanRate: 3.25,
    cmcLoanRate: 4.9,
    years: '20',
    repayType: 'eqInterest',
    monthdataArray: [],
    loanType: 'mix'
  },
  computed: {
    firstPay: function () {
      return this.housePrice*this.downpayPct/100
    },
    totalLoan: function () {
      return (this.housePrice-this.firstPay).toFixed(2)
    },
    cmcLoanCount: function () {
      var cmcloan = this.totalLoan-this.fundLoanCount;
      if (cmcloan < 0){
        return 0 ;
      }else {
        return cmcloan.toFixed(2) ;
      }
    },
    month: function () {
      return this.years*12;
    },
    highPerMonth: function () {
      switch (this.repayType) {
        case 'eqInterest':
          return this.bxpayPerMonth()[0].yuegong;
        case 'eqCatipal':
          return this.bjpayPerMonth()[0].yuegong;
      }
    },
    totalPay: function () {
      switch (this.repayType) {
        case 'eqInterest':
          return this.bxtotalPay();
        case 'eqCatipal':
          return this.bjtotalPay();
      }
    },
  },
  methods: {
    // 月利率
    monthRate: function (type) {
      return this[type + 'LoanRate']/100/12;
    },
    // 等额本息每月还款
    bxmonthTypePay: function () {
      var cmcMonthTypePay,fundMonthTypePay;
      cmcMonthTypePay = (this.cmcLoanCount * 10000 * this.monthRate('cmc')* Math.pow((1 + this.monthRate('cmc')),this.month)) / (Math.pow((1 + this.monthRate('cmc')), this.month) - 1);
      fundMonthTypePay = (this.fundLoanCount * 10000 * this.monthRate('fund')* Math.pow((1 + this.monthRate('fund')),this.month)) / (Math.pow((1 + this.monthRate('fund')), this.month) - 1);
      return cmcMonthTypePay + fundMonthTypePay
    },
    // 等额本息每月利息
    bxyuelixi: function (count) {
      var cmcbxyuelixi,fundbxyuelixi;
      cmcbxyuelixi = this.cmcLoanCount * 10000 * this.monthRate('cmc') * (Math.pow((1 + this.monthRate('cmc')), this.month) - Math.pow((1 + this.monthRate('cmc')), count - 1)) / (Math.pow((1 + this.monthRate('cmc')), this.month) - 1);
      fundbxyuelixi = this.fundLoanCount * 10000 * this.monthRate('fund') * (Math.pow((1 + this.monthRate('fund')), this.month) - Math.pow((1 + this.monthRate('fund')), count - 1)) / (Math.pow((1 + this.monthRate('fund')), this.month) - 1);
      return cmcbxyuelixi + fundbxyuelixi;
    },
    // 等额本息每月需还本金
    bxyuebenjin: function (count) {
      var cmcbxyuebenjin,fundbxyuebenjin
      cmcbxyuebenjin = this.cmcLoanCount * 10000 * this.monthRate('cmc') * Math.pow((1 + this.monthRate('cmc')), count - 1) / (Math.pow((1 + this.monthRate('cmc')), this.month) - 1);
      fundbxyuebenjin = this.fundLoanCount * 10000 * this.monthRate('fund') * Math.pow((1 + this.monthRate('fund')), count - 1) / (Math.pow((1 + this.monthRate('fund')), this.month) - 1);
      return cmcbxyuebenjin + fundbxyuebenjin;
    },
    bxpayPerMonth: function () {
      this.monthdataArray = [];
      var yuelixi,
          yuebenjin,
          yuegong,
          leftFund;
      leftFund = this.bxtotalPay();
      for (var i = 1; i <= this.month; i++) {
        //每月应还利息=贷款本金×月利率×〔(1+月利率)^还款月数-(1+月利率)^(还款月序号-1)〕÷〔(1+月利率)^还款月数-1〕
        yuelixi = this.bxyuelixi(i);
        //每月应还本金=贷款本金×月利率×(1+月利率)^(还款月序号-1)÷〔(1+月利率)^还款月数-1〕
        yuebenjin = this.bxyuebenjin(i);
        yuegong = yuelixi + yuebenjin;
        leftFund = leftFund - yuegong;
        if (leftFund < 0) {
                leftFund = 0
        };
        this.monthdataArray[i-1] = {
          order: i,
          yuelixi: yuelixi.toFixed(2),
          yuebenjin: yuebenjin.toFixed(2),
          yuegong: yuegong.toFixed(2),
          leftFund: leftFund.toFixed(2)
        } ;
      };
      return this.monthdataArray;
    },
    bxtotalPay: function () {
      return (this.bxmonthTypePay() * this.month).toFixed(2);
    },
    bjyuebenjin: function () {
      var cmcbjyuebenjin,fundbjyuebenjin;
      cmcbjyuebenjin = this.cmcLoanCount * 10000 / this.month;
      fundbjyuebenjin = this.fundLoanCount * 10000 / this.month;
      return cmcbjyuebenjin + fundbjyuebenjin;
    },
    bjyuelixi: function (count) {
      var cmcbjyuelixi,fundbjyuelixi;
      cmcbjyuelixi = (this.cmcLoanCount * 10000 - this.cmcLoanCount * 10000 / this.month * (count-1)) * this.monthRate('cmc');
      fundbjyuelixi = (this.fundLoanCount * 10000 - this.fundLoanCount * 10000 / this.month * (count-1)) * this.monthRate('fund');
      return cmcbjyuelixi + fundbjyuelixi;
    },
    bjpayPerMonth: function () {
      this.monthdataArray = [];
      var yuelixi,
          yuebenjin,
          yuegong,
          paidFund = 0,
          leftFund = this.bjtotalPay(),
          i=1;
      yuebenjin=this.bjyuebenjin();
      for (i;i<=this.month;i++){
        yuelixi = this.bjyuelixi(i);
        yuegong = yuebenjin + yuelixi;
        leftFund = leftFund - yuegong;
        if (leftFund < 0 )
          leftFund = 0 ;
        this.monthdataArray[i-1]={
          order: i,
          yuelixi: yuelixi.toFixed(2),
          yuebenjin: yuebenjin.toFixed(2),
          yuegong: yuegong.toFixed(2),
          leftFund: leftFund.toFixed(2)
        };
      }
      return this.monthdataArray;
    },
    bjtotallixi: function () {
      //总利息=〔(总贷款额÷还款月数+总贷款额×月利率)+总贷款额÷还款月数×(1+月利率)〕÷2×还款月数-总贷款额
      var cmctotallixi,fundtotallixi
      cmctotallixi = ((this.cmcLoanCount * 10000 / this.month + this.cmcLoanCount * 10000 * this.monthRate('cmc')) + this.cmcLoanCount * 10000 / this.month * (1 + this.monthRate('cmc'))) / 2 * this.month - this.cmcLoanCount * 10000 ;
      fundtotallixi = ((this.fundLoanCount * 10000 / this.month + this.fundLoanCount * 10000 * this.monthRate('fund')) + this.fundLoanCount * 10000 / this.month * (1 + this.monthRate('fund'))) / 2 * this.month - this.fundLoanCount * 10000 ;
      return (cmctotallixi + fundtotallixi).toFixed(2);
    },
    bjtotalPay: function () {
      var bjalllixi = parseFloat(this.bjtotallixi());
      return (this.fundLoanCount * 10000) + (this.cmcLoanCount * 10000) + bjalllixi;
    }
  }
})
